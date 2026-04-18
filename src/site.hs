{-# LANGUAGE OverloadedStrings #-}
import           Control.Applicative ((<|>), empty)
import           Control.Monad       (filterM)
import           Data.List           (intercalate, nub, nubBy, sort)
import           Data.Maybe          (catMaybes)
import           Data.Time           (defaultTimeLocale, formatTime)
import           Douban.Records      (Category (..), ImportResult (..),
                                      RecordStatus (..), categorySlug,
                                      formatImportWarning, loadDoubanDirectory)
import           Douban.UI           (doubanIndexCtx, doubanStatusPageCtx)
import           Hakyll
import           Network.URI         (escapeURIString, isUnreserved)
import           Site.Utils          (customPandocCompiler, isPublished,
                                      itemCtx, pageCtx, postRoute,
                                      parseDate,
                                      safeCompiler, seriesRoute,
                                      absolutizeUrls, siteUrl, smartRecentFirst)
import           System.IO           (hPutStrLn, stderr)

main :: IO ()
main = hakyll $ do
    match "robots.txt" $ do
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
            bodies <- mapM loadBody ["css/base.css", "css/layout.css", "css/components.css", "css/records.css", "css/post.css"]
            makeItem $ intercalate "\n" bodies

    match "js/*" $ do
        route   idRoute
        compile copyFileCompiler

    match "assets/**" $ do
        route   idRoute
        compile copyFileCompiler

    -- Build tag index from published posts and series only
    tags <- buildTags ("posts/*" .||. "series/*") (fromCapture "tags/*.html")

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

    -- Static pages
    match ("pages/*.markdown" .||. "pages/*.md" ) $ do
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

    -- Posts
    match ("posts/*.markdown" .||. "posts/*.md") $ do
        route postRoute
        compile $ safeCompiler $
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/post.html"    (itemCtx tags)
                >>= loadAndApplyTemplate "templates/default.html" (itemCtx tags)
                >>= relativizeUrls

    -- Series
    match "series/*" $ do
        route seriesRoute
        compile $ safeCompiler $
            customPandocCompiler
                >>= loadAndApplyTemplate "templates/post.html"    (itemCtx tags)
                >>= loadAndApplyTemplate "templates/default.html" (itemCtx tags)
                >>= relativizeUrls

    -- One page per tag
    tagsRules tags $ \tag pat -> do
        route idRoute
        compile $ do
            items <- smartRecentFirst =<< filterM isPublished =<< loadAll pat
            let tagCtx =
                    constField "title" ("Posts tagged: " ++ tag) `mappend`
                    constField "description" ("Browse posts tagged with " ++ tag ++ ".") `mappend`
                    listField "posts" (itemCtx tags) (return items) `mappend`
                    pageCtx
            makeItem ""
                >>= loadAndApplyTemplate "templates/tag.html"     tagCtx
                >>= loadAndApplyTemplate "templates/default.html" tagCtx
                >>= relativizeUrls

    -- /posts.html — full post listing
    create ["posts.html"] $ do
        route idRoute
        compile $ do
            posts <- smartRecentFirst =<< filterM isPublished =<< loadAll ("posts/*.markdown" .||. "posts/*.md")
            let postsCtx =
                    listField "posts" (itemCtx tags) (return posts) `mappend`
                    constField "title" "Posts" `mappend`
                    constField "description" "Browse all posts on the blog." `mappend`
                    pageCtx
            makeItem ""
                >>= loadAndApplyTemplate "templates/post-list-page.html" postsCtx
                >>= loadAndApplyTemplate "templates/default.html"        postsCtx
                >>= relativizeUrls

    -- Homepage
    match "pages/index.html" $ do
        route $ gsubRoute "pages/" (const "")
        compile $ do
            posts <- fmap (take 5) . smartRecentFirst =<< filterM isPublished =<< loadAll ("posts/*.markdown" .||. "posts/*.md")
            let indexCtx = listField "posts" (itemCtx tags) (return posts) `mappend` pageCtx
            getResourceBody
                >>= applyAsTemplate indexCtx
                >>= loadAndApplyTemplate "templates/default.html" indexCtx
                >>= relativizeUrls

    create ["sitemap.xml"] $ do
        route idRoute
        compile $ do
            pageIds <- getMatches ("pages/*.markdown" .||. "pages/*.md")
            postIds <- getMatches ("posts/*.markdown" .||. "posts/*.md")
            seriesIds <- getMatches "series/*"

            pageRoutes <- catMaybes <$> mapM getRoute pageIds
            postRoutes <- catMaybes <$> mapM getRoute postIds
            seriesRoutes <- catMaybes <$> mapM getRoute seriesIds

            publishedPostItems <- filterM isPublished =<< (loadAll ("posts/*.markdown" .||. "posts/*.md") :: Compiler [Item String])
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
                fixedRoutes = ["/posts.html", "/records.html"]
                non404Routes = filter (/= "404.html") pageRoutes
                allRoutes = nub . sort $
                    fixedRoutes
                    ++ map toSitemapPath non404Routes
                    ++ map toSitemapPath postRoutes
                    ++ map toSitemapPath seriesRoutes
                    ++ map toSitemapPath categoryRoutes
                    ++ map toSitemapPath categoryWishlistRoutes
                    ++ map toSitemapPath tagRoutes

            routeEntries <- mapM toRouteEntry allRoutes
            postEntries <- mapM toItemEntry publishedPostItems
            seriesEntries <- mapM toItemEntry publishedSeriesItems

            let dedupeByLoc items =
                    nubBy (\first second -> fst (itemBody first) == fst (itemBody second))
                        (filter (not . null . fst . itemBody) items)
                entries = dedupeByLoc (postEntries ++ seriesEntries ++ routeEntries)
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
