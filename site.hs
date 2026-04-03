{-# LANGUAGE OverloadedStrings #-}
import           Control.Monad    (msum, filterM)
import           Data.Char        (isAlphaNum, toLower)
import           Data.List        (sortBy)
import           Data.Monoid      (mappend)
import           Data.Ord         (Down (..), comparing)
import           Data.Time        (UTCTime, formatTime, defaultTimeLocale,
                                   parseTimeM)
import           Hakyll
import           System.Directory (getModificationTime)
import           System.FilePath  (takeBaseName)
import           Text.Pandoc.Extensions (disableExtension, Extension (Ext_yaml_metadata_block))
import           Text.Pandoc.Options
import           Control.Monad.Except (catchError)



--------------------------------------------------------------------------------
main :: IO ()
main = hakyll $ do
    match "images/*" $ do
        route   idRoute
        compile copyFileCompiler

    match "css/*" $ do
        route   idRoute
        compile compressCssCompiler

    match "files/*" $ do
        route   idRoute
        compile copyFileCompiler

    match "js/*" $ do
        route   idRoute
        compile copyFileCompiler

    match (fromList ["about.md", "projects.md"]) $ do
        route   $ setExtension "html"
        compile $ customPandocCompiler
            >>= loadAndApplyTemplate "templates/default.html" defaultContext
            >>= relativizeUrls

    -- Build tag index from published posts and series only
    tags <- buildTags ("posts/*" .||. "series/*") (fromCapture "tags/*.html")

    -- Posts
    match ("posts/*.markdown" .||. "posts/*.md") $ do
        route $ setExtension "html"
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

    -- One page per tag (only published items)
    tagsRules tags $ \tag pattern -> do
        route idRoute
        compile $ do
            allItems <- loadAll pattern
            items    <- filterM isPublished allItems
            let tagCtx =
                    constField "title" ("Tagged: " ++ tag)          `mappend`
                    listField "posts" (itemCtx tags) (return items)  `mappend`
                    defaultContext
            makeItem ""
                >>= loadAndApplyTemplate "templates/tag.html"     tagCtx
                >>= loadAndApplyTemplate "templates/default.html" tagCtx
                >>= relativizeUrls

    -- /posts.html — full post listing (published only)
    create ["posts.html"] $ do
        route idRoute
        compile $ do
            posts <- smartRecentFirst
                 =<< filterM isPublished
                 =<< loadAll ("posts/*.markdown" .||. "posts/*.md")
            let postsCtx =
                    listField "posts" (itemCtx tags) (return posts) `mappend`
                    constField "title" "Posts"                       `mappend`
                    defaultContext
            makeItem ""
                >>= loadAndApplyTemplate "templates/post-list-page.html" postsCtx
                >>= loadAndApplyTemplate "templates/default.html"        postsCtx
                >>= relativizeUrls

    -- Homepage — most recent 5 published posts
    match "index.html" $ do
        route idRoute
        compile $ do
            posts <- fmap (take 5) . smartRecentFirst
                 =<< filterM isPublished
                 =<< loadAll ("posts/*.markdown" .||. "posts/*.md")
            let indexCtx =
                    listField "posts" (itemCtx tags) (return posts) `mappend`
                    defaultContext
            getResourceBody
                >>= applyAsTemplate indexCtx
                >>= loadAndApplyTemplate "templates/default.html" indexCtx
                >>= relativizeUrls

    match "templates/*" $ compile templateBodyCompiler


--------------------------------------------------------------------------------
-- | Returns True if the item is NOT a draft.
--   Add `draft: true` to a post's frontmatter to hide it from all listings.
--   The compiled page is still accessible by direct URL (useful for previewing).
isPublished :: MonadMetadata m => Item a -> m Bool
isPublished item = do
    meta <- getMetadata (itemIdentifier item)
    return $ case lookupString "draft" meta of
        Just "true"  -> False
        Just "True"  -> False
        Just "yes"   -> False
        _            -> True


--------------------------------------------------------------------------------
-- | Convert a filename to a URL-safe slug.
slugify :: String -> String
slugify = map (\c -> if c == ' ' then '-' else c)
        . map toLower
        . filter (\c -> isAlphaNum c || c == ' ')

-- | Route series files to /series/<slug>.html regardless of original filename.
seriesRoute :: Routes
seriesRoute = customRoute $ \ident ->
    "series/" ++ slugify (takeBaseName (toFilePath ident)) ++ ".html"


--------------------------------------------------------------------------------
-- | Try to parse a date string in common formats.
parseDate :: String -> Maybe UTCTime
parseDate s = msum
    [ parseTimeM True defaultTimeLocale "%Y-%m-%d"           s
    , parseTimeM True defaultTimeLocale "%Y-%m-%dT%H:%M:%SZ" s
    , parseTimeM True defaultTimeLocale "%Y-%m-%d %H:%M:%S"  s
    ]

-- | Get a date for an item: tries metadata keys in order, then falls back
--   to the system file modification time.
getSmartDate :: [String] -> Item a -> Compiler UTCTime
getSmartDate metaKeys item = do
    meta <- getMetadata (itemIdentifier item)
    let fromMeta = msum [ lookupString k meta >>= parseDate | k <- metaKeys ]
    case fromMeta of
        Just t  -> return t
        Nothing -> unsafeCompiler $ getModificationTime (toFilePath (itemIdentifier item))

-- | Sort items newest-first using smart date resolution.
smartRecentFirst :: [Item a] -> Compiler [Item a]
smartRecentFirst items = do
    pairs <- mapM (\i -> getSmartDate ["date", "created"] i >>= \t -> return (t, i)) items
    return $ map snd $ sortBy (comparing (Down . fst)) pairs

-- | A context field that resolves a date from metadata keys or the file system.
smartDateCtx :: String    -- ^ template field name
             -> String    -- ^ display format
             -> [String]  -- ^ metadata keys to try (in order)
             -> Context String
smartDateCtx fieldName fmt metaKeys = field fieldName $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    let fromMeta = msum [ lookupString k meta >>= parseDate | k <- metaKeys ]
    utc <- case fromMeta of
        Just t  -> return t
        Nothing -> unsafeCompiler $ getModificationTime (toFilePath (itemIdentifier item))
    return $ formatTime defaultTimeLocale fmt utc


--------------------------------------------------------------------------------
-- | Universal context for all items (posts and series).
itemCtx :: Tags -> Context String
itemCtx tags =
    tagsField "tags" tags                                           `mappend`
    smartDateCtx "date"     "%B %e, %Y" ["date", "created"]        `mappend`
    smartDateCtx "modified" "%B %e, %Y" ["modified"]               `mappend`
    defaultContext

postCtx :: Tags -> Context String
postCtx = itemCtx

seriesCtx :: Tags -> Context String
seriesCtx = itemCtx


--------------------------------------------------------------------------------
-- | Pandoc compiler.
--
-- Key: Hakyll extracts YAML frontmatter *itself* before passing the document
-- body to Pandoc.  If we leave Pandoc's yaml_metadata_block extension enabled,
-- every '---' horizontal rule in the body is re-interpreted as the start of a
-- YAML block, causing parse failures on ordinary Markdown/LaTeX content.
-- Disabling the extension makes '---' body dividers work correctly while
-- Hakyll's own frontmatter extraction is unaffected.
customPandocCompiler :: Compiler (Item String)
customPandocCompiler = 
    getResourceBody >>= withItemBody (unixFilter "pandoc" args)
  where
    args = [ "--from", "markdown+mark+wikilinks_title_after_pipe-yaml_metadata_block"
           , "--to", "html"
           , "--lua-filter", "filters/obsidian-callouts.lua"
           , "--filter", "pandoc-latex-environment"
           , "--number-sections"
           , "--mathjax"
           ]



--------------------------------------------------------------------------------
-- | A compiler wrapper that catches errors and returns a helpful error message
--   instead of failing the entire build.
safeCompiler :: Compiler (Item String) -> Compiler (Item String)
safeCompiler compiler = compiler `catchError` \errors -> do
    ident <- getUnderlying
    let errorMessage = unlines errors
    makeItem $ "<div class=\"compiler-error\" style=\"border: 3px solid #f44336; padding: 1.5rem; margin: 2rem 0; background: #fff5f5; border-radius: 8px; color: #d32f2f; font-family: system-ui, -apple-system, sans-serif;\">"
            ++ "<h2 style=\"margin-top: 0; color: #b71c1c;\">⚠️ Render Error</h2>"
            ++ "<p>There was an error compiling <strong>" ++ show ident ++ "</strong>. The build continued, but this page could not be rendered normally.</p>"
            ++ "<h3 style=\"font-size: 1rem; margin-bottom: 0.5rem;\">Error Details:</h3>"
            ++ "<pre style=\"background: #ffebee; padding: 1rem; border-radius: 4px; overflow-x: auto; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 0.9rem; line-height: 1.4;\">"
            ++ errorMessage ++ "</pre>"
            ++ "<p style=\"font-size: 0.85rem; margin-bottom: 0; color: #666;\">Check the console for more information or fix the source file to retry.</p>"
            ++ "</div>"