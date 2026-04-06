{-# LANGUAGE OverloadedStrings #-}
import           Control.Applicative (empty)
import           Control.Monad    (msum, filterM)
import           Data.Char        (isAlphaNum, isNumber, isSpace, toLower, ord)
import           Data.List        (isInfixOf, isPrefixOf, sortBy)
import           Data.Maybe       (fromMaybe)
import           Data.Monoid      (mappend)
import           Data.Ord         (Down (..), comparing)
import           Data.Time        (UTCTime, formatTime, defaultTimeLocale,
                                   parseTimeM)
import           Hakyll
import           System.Directory (doesFileExist, getModificationTime)
import           System.FilePath  (takeBaseName)
-- import           Text.Pandoc.Extensions (disableExtension, Extension (Ext_yaml_metadata_block))
-- import           Text.Pandoc.Options
import           Control.Monad.Except (catchError)


siteTitle :: String
siteTitle = "Huangxin Dong"

siteUrl :: String
siteUrl = "https://huangxindong.github.io"

defaultDescription :: String
defaultDescription = "Personal blog by Huangxin Dong on programming, books, games, and notes from everyday learning."

defaultLang :: String
defaultLang = "en"


--------------------------------------------------------------------------------
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

    match "js/*" $ do
        route $ customRoute $ \ident ->
            if toFilePath ident == "js/sw.js"
                then "sw.js"
                else toFilePath ident
        compile copyFileCompiler

    match "assets/**" $ do
        route   idRoute
        compile copyFileCompiler

    -- Build tag index from published posts and series only
    tags <- buildTags ("posts/*" .||. "series/*") (fromCapture "tags/*.html")

    -- Static pages
    match (fromList ["about.md", "projects.md"]) $ do
        route   $ setExtension "html"
        compile $ customPandocCompiler
            >>= loadAndApplyTemplate "templates/default.html" pageCtx
            >>= relativizeUrls

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

    -- One page per tag (only published items)
    tagsRules tags $ \tag pattern -> do
        route idRoute
        compile $ do
            allItems <- loadAll pattern
            items    <- filterM isPublished allItems
            let tagCtx =
                    constField "title" ("Posts tagged: " ++ tag)                    `mappend`
                    constField "description" ("Browse posts tagged with " ++ tag ++ ".") `mappend`
                    listField "posts" (itemCtx tags) (return items)                 `mappend`
                    pageCtx
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
                    listField "posts" (itemCtx tags) (return posts)                            `mappend`
                    constField "title" "Posts"                                                  `mappend`
                    constField "description" "Browse all posts on the blog, listed from newest to oldest." `mappend`
                    pageCtx
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
                    pageCtx
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
slugify = map ((\c -> if c == ' ' then '-' else c) . toLower) . filter (\c -> isAlphaNum c || c == ' ')

-- | Route series files to /series/<slug>.html regardless of original filename.
seriesRoute :: Routes
seriesRoute = customRoute $ \ident ->
    "series/" ++ slugify (takeBaseName (toFilePath ident)) ++ ".html"

-- | Route post files to /posts/<slug>.html regardless of original filename.
postRoute :: Routes
postRoute = customRoute $ \ident ->
    "posts/" ++ slugify (takeBaseName (toFilePath ident)) ++ ".html"


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

metadataDateCtx :: String
                -> String
                -> String
                -> Context String
metadataDateCtx fieldName fmt metaKey = field fieldName $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    case lookupString metaKey meta >>= parseDate of
        Just utc -> return $ formatTime defaultTimeLocale fmt utc
        Nothing  -> empty

mathJaxCtx :: Context String
mathJaxCtx = field "hasMathJax" $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    let sourcePath = toFilePath (itemIdentifier item)
    hasSourceFile <- unsafeCompiler $ doesFileExist sourcePath
    sourceBody <- if hasSourceFile
        then unsafeCompiler $ readFile sourcePath
        else return ""
    let isEnabled key = case lookupString key meta of
            Just "true" -> True
            Just "True" -> True
            Just "yes"  -> True
            Just "on"   -> True
            _           -> False
        isDisabled key = case lookupString key meta of
            Just "false" -> True
            Just "False" -> True
            Just "no"    -> True
            Just "off"   -> True
            _            -> False
        hasMathTag = case lookupString "tags" meta of
            Just tagsValue -> "math" `elem` map (map toLower . stripSpaces) (splitOn ',' tagsValue)
            Nothing        -> False
        detectedMath = hasMathContent sourceBody
        enabled
            | isDisabled "math" || isDisabled "mathjax" = False
            | otherwise = isEnabled "math" || isEnabled "mathjax" || hasMathTag || detectedMath
    return $ if enabled then "true" else ""

langCtx :: Context String
langCtx = field "lang" $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    return $ fromMaybe defaultLang (lookupString "lang" meta)

canonicalUrlCtx :: Context String
canonicalUrlCtx = field "canonicalUrl" $ \item -> do
    route <- getRoute (itemIdentifier item)
    return $ siteUrl ++ maybe "/" canonicalPath route

descriptionCtx :: Context String
descriptionCtx = field "description" $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    return $ escapeHtmlAttr $ fromMaybe defaultDescription $
        msum [ lookupString key meta | key <- ["description", "summary"] ]

navStateCtx :: Context String
navStateCtx = Context $ \key _ item -> do
    route <- getRoute (itemIdentifier item)
    let section = maybe "" sectionFromRoute route
        active target = if section == target then "aria-current=\"page\"" else ""
    case key of
        "homeCurrent"     -> return $ StringField (active "home")
        "postsCurrent"    -> return $ StringField (active "posts")
        "aboutCurrent"    -> return $ StringField (active "about")
        "projectsCurrent" -> return $ StringField (active "projects")
        _                 -> empty

sectionFromRoute :: FilePath -> String
sectionFromRoute route
    | route == "index.html" = "home"
    | route == "posts.html" = "posts"
    | "posts/" `isPrefixOf` route = "posts"
    | "series/" `isPrefixOf` route = "posts"
    | "tags/" `isPrefixOf` route = "posts"
    | route == "about.html" = "about"
    | route == "projects.html" = "projects"
    | otherwise = ""

siteCtx :: Context String
siteCtx =
    constField "siteTitle" siteTitle                 `mappend`
    constField "defaultDescription" defaultDescription `mappend`
    langCtx                                          `mappend`
    descriptionCtx                                   `mappend`
    canonicalUrlCtx                                  `mappend`
    navStateCtx

pageCtx :: Context String
pageCtx = mathJaxCtx `mappend` siteCtx `mappend` defaultContext

--------------------------------------------------------------------------------
-- | Universal context for all items (posts and series).
itemCtx :: Tags -> Context String
itemCtx tags =
    tagsField "tags" tags                                           `mappend`
    smartDateCtx    "date"        "%B %e, %Y" ["date", "created"]  `mappend`
    smartDateCtx    "dateIso"     "%Y-%m-%d" ["date", "created"]   `mappend`
    smartDateCtx    "metaDate"    "%b %e, %Y" ["date", "created"]  `mappend`
    metadataDateCtx "modified"    "%B %e, %Y" "modified"           `mappend`
    metadataDateCtx "modifiedIso" "%Y-%m-%d" "modified"            `mappend`
    metadataDateCtx "metaModified" "%b %e, %Y" "modified"          `mappend`
    readingTimeCtx                                                   `mappend`
    pageCtx

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
    makeItem $ "<div class=\"compiler-error\">"
            ++ "<h2>Render Error</h2>"
            ++ "<p>There was an error compiling <strong>" ++ show ident ++ "</strong>. The build continued, but this page could not be rendered normally.</p>"
            ++ "<h3>Error Details:</h3>"
            ++ "<pre>"
            ++ errorMessage ++ "</pre>"
            ++ "<p class=\"compiler-error-note\">Check the console for more information or fix the source file to retry.</p>"
            ++ "</div>"

canonicalPath :: FilePath -> FilePath
canonicalPath route
    | route == "index.html" = "/"
    | otherwise             = '/' : route

stripHtmlTags :: String -> String
stripHtmlTags [] = []
stripHtmlTags ('<':xs) = stripHtmlTags (drop 1 (dropWhile (/= '>') xs))
stripHtmlTags ('&':'n':'b':'s':'p':';':xs) = ' ' : stripHtmlTags xs
stripHtmlTags ('&':'a':'m':'p':';':xs) = '&' : stripHtmlTags xs
stripHtmlTags ('&':'q':'u':'o':'t':';':xs) = '"' : stripHtmlTags xs
stripHtmlTags ('&':'#':'3':'9':';':xs) = '\'' : stripHtmlTags xs
stripHtmlTags ('&':'l':'t':';':xs) = '<' : stripHtmlTags xs
stripHtmlTags ('&':'g':'t':';':xs) = '>' : stripHtmlTags xs
stripHtmlTags (x:xs) = x : stripHtmlTags xs

collapseWhitespace :: String -> String
collapseWhitespace = unwords . words

stripSpaces :: String -> String
stripSpaces = reverse . dropWhile isSpace . reverse . dropWhile isSpace

splitOn :: Char -> String -> [String]
splitOn _ [] = [""]
splitOn delimiter (c:cs)
    | c == delimiter = "" : splitOn delimiter cs
    | otherwise =
        case splitOn delimiter cs of
            [] -> [[c]]
            (segment:rest) -> (c : segment) : rest

hasMathContent :: String -> Bool
hasMathContent body =
    any (`isInfixOf` body)
        [ "$$"
        , "\\("
        , "\\)"
        , "\\["
        , "\\]"
        , "\\begin{equation"
        , "\\begin{align"
        , "\\begin{gather"
        , "\\begin{multline"
        , "\\begin{matrix"
        , "\\begin{cases"
        , "\\begin{pmatrix"
        , "\\begin{bmatrix"
        , "\\begin{vmatrix"
        , "\\begin{Vmatrix"
        ]

escapeHtmlAttr :: String -> String
escapeHtmlAttr [] = []
escapeHtmlAttr (c:cs) = case c of
    '&'  -> "&amp;"  ++ escapeHtmlAttr cs
    '"'  -> "&quot;" ++ escapeHtmlAttr cs
    '<'  -> "&lt;"   ++ escapeHtmlAttr cs
    '>'  -> "&gt;"   ++ escapeHtmlAttr cs
    '\'' -> "&#39;"  ++ escapeHtmlAttr cs
    _    -> c : escapeHtmlAttr cs

readingTimeCtx :: Context String
readingTimeCtx =
    field "readTime" (\item -> return $ show $ readingMinutes (stats item)) `mappend`
    field "wordCount" (\item -> return $ show $ readingUnits (stats item))
  where
    stats item = readingStats (stripHtmlTags (itemBody item))

data ReadingStats = ReadingStats
    { readingUnits :: Int
    , readingMinutes :: Int
    }

readingStats :: String -> ReadingStats
readingStats text =
    let normalized = collapseWhitespace text
        latinWords = countLatinWords normalized
        cjkChars   = countCjkChars normalized
        readingLoad = fromIntegral latinWords / 220.0 + fromIntegral cjkChars / 650.0
        totalUnits = latinWords + cjkChars
        minutes
            | totalUnits <= 0 = 1
            | otherwise       = max 1 (ceiling readingLoad)
    in ReadingStats totalUnits minutes

countLatinWords :: String -> Int
countLatinWords = go False 0
  where
    go _ acc [] = acc
    go inWord acc (c:cs)
        | isLatinWordChar c =
            let acc' = if inWord then acc else acc + 1
            in go True acc' cs
        | otherwise = go False acc cs

countCjkChars :: String -> Int
countCjkChars = length . filter isCjkChar

isLatinWordChar :: Char -> Bool
isLatinWordChar c = isAsciiLatin c || isNumber c || c == '\'' || c == '-'

isAsciiLatin :: Char -> Bool
isAsciiLatin c = ('a' <= lower && lower <= 'z')
  where
    lower = toLower c

isCjkChar :: Char -> Bool
isCjkChar c =
    let code = ord c
    in  (code >= 0x4E00  && code <= 0x9FFF)
     || (code >= 0x3400  && code <= 0x4DBF)
     || (code >= 0x20000 && code <= 0x2A6DF)
     || (code >= 0x2A700 && code <= 0x2B73F)
     || (code >= 0x2B740 && code <= 0x2B81F)
     || (code >= 0x2B820 && code <= 0x2CEAF)
     || (code >= 0xF900  && code <= 0xFAFF)
