{-# LANGUAGE OverloadedStrings #-}
import           Control.Applicative ((<|>), empty)
import           Control.Monad       (filterM, unless)
import           System.Directory    (doesFileExist)
import           Data.List           (intercalate, nub, nubBy, sort)
import           Data.Maybe          (catMaybes, fromMaybe)
import           Data.Time           (defaultTimeLocale, formatTime)
import           Douban.Records      (Category (..), ImportResult (..),
                                      RecordStatus (..), categorySlug,
                                      formatImportWarning, loadDoubanDirectory)
import           Douban.UI           (doubanIndexCtx, doubanStatusPageCtx)
import           Hakyll
import           Network.URI         (escapeURIString, isUnreserved)
import           Site.Utils          (customPandocCompiler, isPublished,
                                      isPublishedId,
                                      itemCtx, pageCtx, postCtx, postRoute,
                                      projectCtx, projectRoute,
                                      parseDate,
                                      safeCompiler, seriesRoute,
                                      absolutizeUrls, defaultDescription,
                                      escapeHtmlAttr,
                                      siteUrl, slugify, smartRecentFirst,
                                      stripPrefixCompat, stripSuffixCompat)
import           System.FilePath     (dropExtension, takeBaseName,
                                      takeExtension)
import           System.IO           (hPutStrLn, stderr)

postSourcePattern :: Pattern
postSourcePattern = "posts/*.markdown" .||. "posts/*.md"

bilingualPostEnPattern :: Pattern
bilingualPostEnPattern = "posts/*.en.markdown" .||. "posts/*.en.md"

bilingualPostZhPattern :: Pattern
bilingualPostZhPattern = "posts/*.zh.markdown" .||. "posts/*.zh.md"

bilingualPostPattern :: Pattern
bilingualPostPattern = bilingualPostEnPattern .||. bilingualPostZhPattern

singlePostPattern :: Pattern
singlePostPattern =
    (postSourcePattern .&&. complement bilingualPostEnPattern)
        .&&. complement bilingualPostZhPattern

publishedPostPattern :: Pattern
publishedPostPattern = singlePostPattern .||. bilingualPostEnPattern

main :: IO ()
main = hakyll $ do
    match "robots.txt" $ do
        route   idRoute
        compile copyFileCompiler

    -- Unlisted online CV: copied verbatim, kept out of sitemap and
    -- site navigation; the page itself carries a noindex meta tag.
    match "cv/index.html" $ do
        route   idRoute
        compile copyFileCompiler

    match "favicon/*" $ do
        route   idRoute
        compile copyFileCompiler

    match (fromList ["favicon.ico"]) $ do
        route   idRoute
        compile copyFileCompiler

    match "css/*" $ do
        route   idRoute
        compile compressCssCompiler

    create ["css/site.css"] $ do
        route idRoute
        compile $ do
            bodies <- mapM loadBody ["css/base.css", "css/layout.css", "css/components.css", "css/records.css", "css/project.css", "css/post.css"]
            makeItem $ intercalate "\n" bodies

    match "js/*" $ do
        route   idRoute
        compile copyFileCompiler

    match "assets/**" $ do
        route   idRoute
        compile copyFileCompiler

    -- Build tag index from published posts and series only
    let getPublishedTags ident = do
            published <- isPublishedId ident
            if published then getTags ident else return []

    tags <- buildTagsWith getPublishedTags (publishedPostPattern .||. "series/*" .||. "projects/*") (fromCapture "tags/*.html")

    -- Douban data loading helper
    let loadImportedDouban = do
            -- Register dependency on all CSV files
            _ <- loadAll "assets/douban/**/*.csv" :: Compiler [Item CopyFile]
            imported <- unsafeCompiler $ loadDoubanDirectory "assets/douban"
            unsafeCompiler $ mapM_ (hPutStrLn stderr . formatImportWarning) (importWarnings imported)
            return imported

    -- Douban Records Index
    create ["records.html"] $ do
            route idRoute
            compile $ do
                imported <- loadImportedDouban
                let ctx = doubanIndexCtx imported pageCtx
                makeItem ""
                    >>= loadAndApplyTemplate "templates/douban-index.html" ctx
                    >>= loadAndApplyTemplate "templates/page.html" ctx
                    >>= loadAndApplyTemplate "templates/default.html" ctx
                    >>= relativizeUrls

    -- Douban Category Pages
    mapM_ (createRecordStatusPages loadImportedDouban) [Book, Movie, Music, Game]

    -- /posts.html - full post listing
    match "pages/posts.md" $ do
        route $ setExtension "html" `composeRoutes` gsubRoute "pages/" (const "")
        compile $ do
            posts <- loadPublishedSorted publishedPostPattern
            let postsPageCtx =
                    listField "posts" (postCtx tags) (return posts) `mappend`
                    constField "title" "Posts" `mappend`
                    constField "description" "A list of posts on various topics." `mappend`
                    pageCtx
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/post-list-page.html" postsPageCtx
                >>= loadAndApplyTemplate "templates/default.html" postsPageCtx
                >>= relativizeUrls

    -- /projects.html - full project listing
    match "pages/projects.md" $ do
        route $ setExtension "html" `composeRoutes` gsubRoute "pages/" (const "")
        compile $ do
            projects <- loadPublishedSorted "projects/*"
            let projectsCtx =
                    listField "projects" (projectCtx tags) (return projects) `mappend`
                    constField "title" "Projects" `mappend`
                    constField "description" "A growing list of projects, experiments, and things I am building." `mappend`
                    pageCtx
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/project-list-page.html" projectsCtx
                >>= loadAndApplyTemplate "templates/default.html" projectsCtx
                >>= relativizeUrls

    -- Static pages
    match ((("pages/*.markdown" .||. "pages/*.md")
        .&&. complement "pages/posts.md")
        .&&. complement "pages/projects.md") $ do
        route   $ setExtension "html" `composeRoutes` gsubRoute "pages/" (const "")
        compile $ do
            ident <- getUnderlying
            rendered <- customPandocCompiler
                >>= loadAndApplyTemplate "templates/page.html"    pageCtx
                >>= loadAndApplyTemplate "templates/default.html" pageCtx
            if toFilePath ident == "pages/404.md"
                then return $ fmap (absolutizeUrls siteUrl) rendered
                else relativizeUrls rendered

    -- Redirect common language-prefix probes to canonical homepage.
    create ["en/index.html", "zh-cn/index.html"] $ do
        route idRoute
        compile $ makeItem $ redirectHtml siteUrl

    -- Bilingual post sources are compiled internally; only the English
    -- source writes the combined public page at /posts/<slug>.html.
    match bilingualPostZhPattern $ do
        compile $ safeCompiler customPandocCompiler
            >>= saveSnapshot "content"

    match bilingualPostEnPattern $ do
        route bilingualPostRoute
        compile $ do
            -- Fail early with a clear message rather than a cryptic
            -- missing-snapshot error later.
            ident <- getUnderlying
            let zhIdent = bilingualPartnerIdentifier ident
                zhPath  = toFilePath zhIdent
            zhExists <- unsafeCompiler $ doesFileExist zhPath
            unless zhExists $
                fail $ "Bilingual partner not found: " ++ zhPath
                    ++ "\n  Every .en.md must have a matching .zh.md alongside it."
            safeCompiler $ do
                en <- customPandocCompiler >>= saveSnapshot "content"
                zh <- loadSnapshot zhIdent "content"
                defaultLangValue <- bilingualDefaultLanguage (itemIdentifier en)
                enMeta <- getMetadata (itemIdentifier en)
                zhMeta <- getMetadata zhIdent
                let combined = withBilingualPanels defaultLangValue (itemBody en) (itemBody zh)
                    ctx = bilingualPostCtx tags defaultLangValue enMeta zhMeta
                makeItem combined
                    >>= loadAndApplyTemplate "templates/post.html"    ctx
                    >>= loadAndApplyTemplate "templates/default.html" ctx
                    >>= relativizeUrls

    -- Posts
    match singlePostPattern $ do
        route postRoute
        compile $ safeCompiler $
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/post.html"    (postCtx tags)
                >>= loadAndApplyTemplate "templates/default.html" (postCtx tags)
                >>= relativizeUrls

    -- Projects
    match ("projects/*.markdown" .||. "projects/*.md") $ do
        route projectRoute
        compile $ safeCompiler $
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/project.html" (projectCtx tags)
                >>= loadAndApplyTemplate "templates/default.html" (projectCtx tags)
                >>= relativizeUrls

    -- Series
    match "series/*" $ do
        route seriesRoute
        compile $ safeCompiler $
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/post.html"    (postCtx tags)
                >>= loadAndApplyTemplate "templates/default.html" (postCtx tags)
                >>= relativizeUrls

    -- One page per tag
    tagsRules tags $ \tag pat -> do
        route idRoute
        compile $ do
            items <- smartRecentFirst =<< filterM isPublished =<< loadAll pat
            let tagCtx =
                    constField "title" ("Tagged: " ++ tag) `mappend`
                    constField "description" ("Browse published entries tagged with " ++ tag ++ ".") `mappend`
                    listField "posts" (itemCtx tags) (return items) `mappend`
                    pageCtx
            makeItem ""
                >>= loadAndApplyTemplate "templates/tag.html"     tagCtx
                >>= loadAndApplyTemplate "templates/default.html" tagCtx
                >>= relativizeUrls

    -- Homepage
    match "pages/index.html" $ do
        route $ gsubRoute "pages/" (const "")
        compile $ do
            posts <- fmap (take 5) . smartRecentFirst =<< filterM isPublished =<< loadAll publishedPostPattern
            projects <- fmap (take 3) $ filterM hasImage =<< loadPublishedSorted "projects/*"
            let indexCtx =
                    listField "posts" (itemCtx tags) (return posts) `mappend`
                    listField "projects" (projectCtx tags) (return projects) `mappend`
                    pageCtx
            getResourceBody
                >>= applyAsTemplate indexCtx
                >>= loadAndApplyTemplate "templates/default.html" indexCtx
                >>= relativizeUrls

    create ["sitemap.xml"] $ do
        route idRoute
        compile $ do
            pageIds <- getMatches ("pages/*.markdown" .||. "pages/*.md")
            postIds <- filterM isPublishedId =<< getMatches publishedPostPattern
            projectIds <- filterM isPublishedId =<< getMatches "projects/*"
            seriesIds <- filterM isPublishedId =<< getMatches "series/*"

            pageRoutes <- catMaybes <$> mapM getRoute pageIds
            postRoutes <- catMaybes <$> mapM getRoute postIds
            projectRoutes <- catMaybes <$> mapM getRoute projectIds
            seriesRoutes <- catMaybes <$> mapM getRoute seriesIds

            publishedPostItems <- filterM isPublished =<< (loadAll publishedPostPattern :: Compiler [Item String])
            publishedProjectItems <- mapM load projectIds :: Compiler [Item String]
            publishedSeriesItems <- filterM isPublished =<< (loadAll "series/*" :: Compiler [Item String])

            let sitemapLastMod ident = do
                    meta <- getMetadata ident
                    let fromMeta =
                            (lookupString "modified" meta >>= parseDate)
                            <|> (lookupString "date" meta >>= parseDate)
                            <|> (lookupString "created" meta >>= parseDate)
                    return $ formatTime defaultTimeLocale "%Y-%m-%d" <$> fromMeta

                toSitemapPath route =
                    case route of
                        "index.html" -> "/"
                        "/index.html" -> "/"
                        _ -> if null route || head route == '/'
                                then route
                                else '/' : route

                encodeSitemapPath = escapeURIString (\c -> isUnreserved c || c == '/' || c == '.' || c == '%')

                toAbsUrl route =
                    let path = encodeSitemapPath (toSitemapPath route)
                    in if path == "/" || null path
                        then siteUrl ++ "/"
                        else siteUrl ++ path

                toRouteEntry route = makeItem (toAbsUrl route, Nothing :: Maybe String)

                toItemEntry item = do
                    route <- getRoute $ itemIdentifier item
                    case route of
                        Nothing -> makeItem ("", Nothing :: Maybe String)
                        Just r -> do
                            lm <- sitemapLastMod (itemIdentifier item)
                            makeItem (toAbsUrl r, lm)

            let categoryRoutes = [ "records/" ++ slug ++ ".html"
                                 | category <- [Book, Movie, Music, Game]
                                 , let slug = categorySlug category
                                 ]
                categoryWishlistRoutes = [ "records/" ++ slug ++ "/wishlist.html"
                                         | category <- [Book, Movie, Music, Game]
                                         , let slug = categorySlug category
                                         ]
                tagRoutes = [ "tags/" ++ tag ++ ".html" | (tag, _) <- tagsMap tags ]
                fixedRoutes = ["/posts.html", "/projects.html", "/records.html"]
                non404Routes = filter (/= "404.html") pageRoutes
                allRoutes = nub . sort $
                    fixedRoutes
                    ++ map toSitemapPath non404Routes
                    ++ map toSitemapPath postRoutes
                    ++ map toSitemapPath projectRoutes
                    ++ map toSitemapPath seriesRoutes
                    ++ map toSitemapPath categoryRoutes
                    ++ map toSitemapPath categoryWishlistRoutes
                    ++ map toSitemapPath tagRoutes

            routeEntries <- mapM toRouteEntry allRoutes
            postEntries <- mapM toItemEntry publishedPostItems
            projectEntries <- mapM toItemEntry publishedProjectItems
            seriesEntries <- mapM toItemEntry publishedSeriesItems

            let dedupeByLoc items =
                    nubBy (\first second -> fst (itemBody first) == fst (itemBody second))
                        (filter (not . null . fst . itemBody) items)
                entries = dedupeByLoc (postEntries ++ projectEntries ++ seriesEntries ++ routeEntries)
                entryCtx =
                    field "loc" (return . fst . itemBody) `mappend`
                    field "lastmod" (maybe empty return . snd . itemBody)
            let sitemapCtx =
                    constField "homeLoc" (siteUrl ++ "/") `mappend`
                    listField "pages" entryCtx (return entries) `mappend`
                    defaultContext

            makeItem ""
                >>= loadAndApplyTemplate "templates/sitemap.xml" sitemapCtx

    match "templates/*" $ compile templateBodyCompiler

--------------------------------------------------------------------------------
-- Helpers

createRecordStatusPages :: Compiler ImportResult -> Category -> Rules ()
createRecordStatusPages importedCompiler category = do
    createRecordStatusPage importedCompiler category Done
    createRecordStatusPage importedCompiler category Wishlist

createRecordStatusPage :: Compiler ImportResult -> Category -> RecordStatus -> Rules ()
createRecordStatusPage importedCompiler category status =
    let slug = categorySlug category
        path = case status of
            Done     -> "records/" ++ slug ++ ".html"
            Wishlist -> "records/" ++ slug ++ "/wishlist.html"
    in create [fromFilePath path] $ do
        route idRoute
        compile $ do
            imported <- importedCompiler
            let ctx = doubanStatusPageCtx imported category status pageCtx
            makeItem ""
                >>= loadAndApplyTemplate "templates/douban-category.html" ctx
                >>= loadAndApplyTemplate "templates/page.html" ctx
                >>= loadAndApplyTemplate "templates/default.html" ctx
                >>= relativizeUrls

loadPublishedSorted :: Pattern -> Compiler [Item String]
loadPublishedSorted pat = do
    ids <- filterM isPublishedId =<< getMatches pat
    smartRecentFirst =<< mapM load ids

hasImage :: Item a -> Compiler Bool
hasImage item = do
    meta <- getMetadata (itemIdentifier item)
    return $ maybe False (not . null) (lookupString "image" meta)

bilingualPostCtx :: Tags -> String -> Metadata -> Metadata -> Context String
bilingualPostCtx tags defaultLangValue enMeta zhMeta =
    constField "hasTranslations" "true"             `mappend`
    constField "defaultLanguage" defaultLangValue   `mappend`
    constField "lang" defaultLangValue              `mappend`
    constField "title" defaultTitle                 `mappend`
    constField "titleEn" titleEn                    `mappend`
    constField "titleZh" titleZh                    `mappend`
    constField "description" defaultDescriptionText `mappend`
    constField "descriptionEn" descriptionEn        `mappend`
    constField "descriptionZh" descriptionZh        `mappend`
    postCtx tags
  where
    titleEn = metadataText "title" "Untitled" enMeta
    titleZh = metadataText "title" titleEn zhMeta
    descriptionEn = metadataDescription enMeta
    descriptionZh = metadataDescription zhMeta
    defaultTitle = if defaultLangValue == "zh" then titleZh else titleEn
    defaultDescriptionText =
        if defaultLangValue == "zh" then descriptionZh else descriptionEn

metadataDescription :: Metadata -> String
metadataDescription meta =
    escapeHtmlAttr $
        fromMaybe defaultDescription (lookupString "description" meta <|> lookupString "summary" meta)

metadataText :: String -> String -> Metadata -> String
metadataText key fallback meta = fromMaybe fallback (lookupString key meta)

-- | Route posts/foo.en.md and posts/foo.en.markdown to /posts/foo.html.
bilingualPostRoute :: Routes
bilingualPostRoute = customRoute $ \ident ->
    let path = toFilePath ident
        base = takeBaseName path
        slug = fromMaybe base (stripSuffixCompat ".en" base)
    in  "posts/" ++ slugify slug ++ ".html"

bilingualPartnerIdentifier :: Identifier -> Identifier
bilingualPartnerIdentifier ident =
    fromFilePath $
        let path = toFilePath ident
            ext = takeExtension path
            base = dropExtension path
        in  maybe path (\root -> root ++ ".zh" ++ ext) (stripSuffixCompat ".en" base)

bilingualDefaultLanguage :: Identifier -> Compiler String
bilingualDefaultLanguage ident = do
    meta <- getMetadata ident
    let requested = lookupString "defaultLang" meta <|> lookupString "lang" meta
    return $ case requested of
        Just "zh" -> "zh"
        _         -> "en"

withBilingualPanels :: String -> String -> String -> String
withBilingualPanels defaultLangValue enBody zhBody =
    unlines
        [ "<div class=\"lang-panels\" data-lang-root data-default-lang=\"" ++ defaultLangValue ++ "\">"
        , langPanel "en" (defaultLangValue /= "en") enBody
        , langPanel "zh" (defaultLangValue /= "zh") zhBody
        , "</div>"
        ]

langPanel :: String -> Bool -> String -> String
langPanel langCode hiddenByDefault body =
    let hiddenAttr = if hiddenByDefault then " hidden" else ""
    in  "<section class=\"lang-panel\" data-lang-panel=\"" ++ langCode ++ "\" lang=\"" ++ langCode ++ "\"" ++ hiddenAttr ++ ">\n"
        ++ prefixPanelIds langCode body
        ++ "\n</section>"

-- | Prefix all @id@ attributes and internal @href="#..."@ anchors in a
-- rendered HTML fragment with a language code.
--
-- When two language panels share a page, Pandoc can generate identical @id@s
-- for headings (or footnotes) with the same text.  The browser's
-- @getElementById@ always returns the first DOM match, so TOC links pointing
-- at the hidden panel's heading would scroll to the wrong place.  Scoping
-- every id to its panel eliminates the conflict: TOC.js already filters to
-- visible headings via @visibleHeading@, so it builds @href="#en-…"@ or
-- @href="#zh-…"@ links that unambiguously target the active panel.
prefixPanelIds :: String -> String -> String
prefixPanelIds lang = go
  where
    pref = lang ++ "-"
    go [] = []
    go s@(c:cs)
        | Just rest <- stripPrefixCompat " id=\"" s
            = " id=\"" ++ pref ++ goAttr rest
        | Just rest <- stripPrefixCompat " href=\"#" s
            = " href=\"#" ++ pref ++ goAttr rest
        | otherwise
            = c : go cs
    goAttr []        = []
    goAttr ('"':rest) = '"' : go rest
    goAttr (c:cs)    = c : goAttr cs

--------------------------------------------------------------------------------
-- | Helper to generate a redirecting HTML page.
redirectHtml :: String -> String
redirectHtml url = unlines
    [ "<!doctype html>"
    , "<html lang=\"en\">"
    , "<head>"
    , "  <meta charset=\"utf-8\">"
    , "  <meta http-equiv=\"refresh\" content=\"0; url=" ++ url ++ "/\">"
    , "  <link rel=\"canonical\" href=\"" ++ url ++ "/\">"
    , "  <title>Redirecting...</title>"
    , "  <script>location.replace('" ++ url ++ "/');</script>"
    , "</head>"
    , "<body>"
    , "  <p>Redirecting to <a href=\"" ++ url ++ "/\">homepage</a>...</p>"
    , "</body>"
    , "</html>"
    ]
