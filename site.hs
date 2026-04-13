{-# LANGUAGE OverloadedStrings #-}
import           Control.Monad       (filterM)
import           Data.List           (intercalate)
import           Douban.Records      (Category (..), ImportResult (..),
                                      RecordStatus (..), categorySlug,
                                      formatImportWarning, loadDoubanDirectory)
import           Douban.UI           (doubanIndexCtx, doubanStatusPageCtx)
import           Hakyll
import           Site.Utils          (customPandocCompiler, isPublished,
                                      itemCtx, pageCtx, postRoute,
                                      safeCompiler, seriesRoute,
                                      smartRecentFirst)
import           System.IO           (hPutStrLn, stderr)

main :: IO ()
main = hakyll $ do
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

    -- Static pages
    match (fromList ["about.md", "projects.md"]) $ do
        route   $ setExtension "html"
        compile $ customPandocCompiler
            >>= loadAndApplyTemplate "templates/page.html"    pageCtx
            >>= loadAndApplyTemplate "templates/default.html" pageCtx
            >>= relativizeUrls

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
    match "index.html" $ do
        route idRoute
        compile $ do
            posts <- fmap (take 5) . smartRecentFirst =<< filterM isPublished =<< loadAll ("posts/*.markdown" .||. "posts/*.md")
            let indexCtx = listField "posts" (itemCtx tags) (return posts) `mappend` pageCtx
            getResourceBody
                >>= applyAsTemplate indexCtx
                >>= loadAndApplyTemplate "templates/default.html" indexCtx
                >>= relativizeUrls

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
