{-# LANGUAGE OverloadedStrings #-}
module Site.Utils
    ( slugify
    , parseDate
    , getSmartDate
    , smartRecentFirst
    , smartDateCtx
    , metadataDateCtx
    , mathJaxCtx
    , langCtx
    , canonicalUrlCtx
    , descriptionCtx
    , navStateCtx
    , sectionFromRoute
    , isPublished
    , customPandocCompiler
    , safeCompiler
    , stripHtmlTags
    , collapseWhitespace
    , splitOn
    , hasMathContent
    , hasLikelyInlineDollarMath
    , readingTimeCtx
    , escapeHtmlAttr
    , escapeHtmlText
    , siteTitle
    , siteUrl
    , defaultDescription
    , defaultLang
    , postRoute
    , seriesRoute
    , stripSpaces
    , siteCtx
    , pageCtx
    , itemCtx
    , postCtx
    , seriesCtx
    , absolutizeUrls
    ) where

import           Control.Applicative (empty)
import           Control.Monad       (filterM, msum)
import           Control.Monad.Except (catchError)
import           Data.Char           (isAlphaNum, isAsciiLower, isNumber,
                                      isSpace, ord, toLower)
import           Data.List           (intercalate, isInfixOf, isPrefixOf, sortBy)
import           Data.Maybe          (fromMaybe)
import           Data.Monoid         (mappend)
import           Data.Ord            (Down (..), comparing)
import           Data.Time           (UTCTime, defaultTimeLocale, formatTime,
                                      parseTimeM)
import           Hakyll
import           Hakyll.Web.Pandoc   (defaultHakyllReaderOptions,
                                      defaultHakyllWriterOptions,
                                      readPandocWith, writePandocWith)
import           Site.Pandoc.Callouts (transformObsidianCallouts)
import           System.Directory    (doesFileExist, getModificationTime)
import           System.FilePath     (takeBaseName)
import           Text.Pandoc.Options (Extension (Ext_mark,
                                                 Ext_wikilinks_title_after_pipe,
                                                 Ext_yaml_metadata_block),
                                      HTMLMathMethod (MathJax),
                                      ReaderOptions (readerExtensions),
                                      WriterOptions (writerHTMLMathMethod,
                                                     writerNumberSections),
                                      enableExtension)

siteTitle :: String
siteTitle = "Huangxin Dong"

siteUrl :: String
siteUrl = "https://huangxindong.github.io"

defaultDescription :: String
defaultDescription = "Personal blog by Huangxin Dong on programming, books, games, and notes from everyday learning."

defaultLang :: String
defaultLang = "en"

--------------------------------------------------------------------------------
-- | Returns True if the item is NOT a draft.
isPublished :: MonadMetadata m => Item a -> m Bool
isPublished item = do
    meta <- getMetadata (itemIdentifier item)
    return $ case lookupString "draft" meta of
        Just "true"  -> False
        Just "True"  -> False
        Just "yes"   -> False
        _            -> True

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

-- | Try to parse a date string in common formats.
parseDate :: String -> Maybe UTCTime
parseDate s = msum
    [ parseTimeM True defaultTimeLocale "%Y-%m-%d"           s
    , parseTimeM True defaultTimeLocale "%Y-%m-%dT%H:%M:%SZ" s
    , parseTimeM True defaultTimeLocale "%Y-%m-%d %H:%M:%S"  s
    ]

-- | Get a date for an item.
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
smartDateCtx :: String -> String -> [String] -> Context String
smartDateCtx fieldName fmt metaKeys = field fieldName $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    let fromMeta = msum [ lookupString k meta >>= parseDate | k <- metaKeys ]
    utc <- case fromMeta of
        Just t  -> return t
        Nothing -> unsafeCompiler $ getModificationTime (toFilePath (itemIdentifier item))
    return $ formatTime defaultTimeLocale fmt utc

metadataDateCtx :: String -> String -> String -> Context String
metadataDateCtx fieldName fmt metaKey = field fieldName $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    case lookupString metaKey meta >>= parseDate of
        Just utc -> return $ formatTime defaultTimeLocale fmt utc
        Nothing  -> empty

mathJaxCtx :: Context String
mathJaxCtx = field "hasMathJax" $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    let sourcePath = toFilePath (itemIdentifier item)
        allowAutoDetection = "posts/" `isPrefixOf` sourcePath || "series/" `isPrefixOf` sourcePath
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
            | otherwise = isEnabled "math" || isEnabled "mathjax"
                       || (allowAutoDetection && (hasMathTag || detectedMath))
    if enabled then return "true" else empty

langCtx :: Context String
langCtx = field "lang" $ \item -> do
    meta <- getMetadata (itemIdentifier item)
    return $ fromMaybe defaultLang (lookupString "lang" meta)

canonicalUrlCtx :: Context String
canonicalUrlCtx = field "canonicalUrl" $ \item -> do
    route <- getRoute (itemIdentifier item)
    return $ case route of
        Nothing -> siteUrl ++ "/"
        Just "index.html" -> siteUrl ++ "/"
        Just r -> siteUrl ++ '/' : r

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
        "recordsCurrent"  -> return $ StringField (active "records")
        _                 -> empty

sectionFromRoute :: FilePath -> String
sectionFromRoute route
    | route == "index.html" = "home"
    | route == "posts.html" = "posts"
    | "posts/" `isPrefixOf` route = "posts"
    | "series/" `isPrefixOf` route = "posts"
    | "tags/" `isPrefixOf` route = "posts"
    | route == "records.html" = "records"
    | "records/" `isPrefixOf` route = "records"
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

customPandocCompiler :: Compiler (Item String)
customPandocCompiler = do
    ident <- getUnderlying
    meta <- getMetadata ident
    let readerOptions = customReaderOptions
        writerOptions = customWriterOptions meta
    source <- getResourceBody
    document <- readPandocWith readerOptions source
    return $ writePandocWith writerOptions (fmap transformObsidianCallouts document)

customReaderOptions :: ReaderOptions
customReaderOptions =
    defaultHakyllReaderOptions
        { readerExtensions =
            enableExtension Ext_mark
            . enableExtension Ext_wikilinks_title_after_pipe
            . enableExtension Ext_yaml_metadata_block
            $ readerExtensions defaultHakyllReaderOptions
        }

customWriterOptions :: Metadata -> WriterOptions
customWriterOptions meta =
    defaultHakyllWriterOptions
        { writerHTMLMathMethod = MathJax ""
        , writerNumberSections = metadataFlagDefaultTrue "number-sections" meta
        }

metadataFlagDefaultTrue :: String -> Metadata -> Bool
metadataFlagDefaultTrue key meta =
    case fmap (map toLower) (lookupString key meta) of
        Just "false" -> False
        Just "no"    -> False
        Just "off"   -> False
        Just "true"  -> True
        Just "yes"   -> True
        Just "on"    -> True
        _            -> True

safeCompiler :: Compiler (Item String) -> Compiler (Item String)
safeCompiler compiler = compiler `catchError` \errors -> do
    ident <- getUnderlying
    let errorMessage = unlines errors
    makeItem $ "<div class=\"compiler-error\">"
            ++ "<h2>Render Error</h2>"
            ++ "<p>There was an error compiling <strong>" ++ show ident ++ "</strong>.</p>"
            ++ "<h3>Error Details:</h3>"
            ++ "<pre>" ++ errorMessage ++ "</pre>"
            ++ "</div>"

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
    hasLikelyInlineDollarMath body
    || any (`isInfixOf` body)
        [ "$$", "\\(", "\\)", "\\[", "\\]"
        , "\\begin{equation", "\\begin{align", "\\begin{gather"
        , "\\begin{multline", "\\begin{matrix", "\\begin{cases"
        ]

hasLikelyInlineDollarMath :: String -> Bool
hasLikelyInlineDollarMath = go False False False
  where
    go _ _ _ [] = False
    go isEscaped inMath hasContent (c:cs)
        | isEscaped = go False inMath (hasContent || (inMath && not (isSpace c))) cs
        | c == '\\' = go True inMath hasContent cs
        | c == '$' =
            if inMath
                then hasContent || go False False False cs
                else go False True False cs
        | otherwise = go False inMath (hasContent || (inMath && not (isSpace c))) cs

readingTimeCtx :: Context String
readingTimeCtx =
    field "readTime" (return . show . readingMinutes . stats) `mappend`
    field "wordCount" (return . show . readingUnits . stats)
  where
    stats item = readingStats (stripHtmlTags (itemBody item))

data ReadingStats = ReadingStats { readingUnits :: Int, readingMinutes :: Int }

readingStats :: String -> ReadingStats
readingStats text =
    let normalized = collapseWhitespace text
        latinWords = countLatinWords normalized
        cjkChars   = countCjkChars normalized
        readingLoad = fromIntegral latinWords / 220.0 + fromIntegral cjkChars / 650.0
        totalUnits = latinWords + cjkChars
        minutes = if totalUnits <= 0 then 1 else max 1 (ceiling readingLoad)
    in ReadingStats totalUnits minutes

countLatinWords :: String -> Int
countLatinWords = go False 0
  where
    go _ acc [] = acc
    go inWord acc (c:cs)
        | isLatinWordChar c = go True (if inWord then acc else acc + 1) cs
        | otherwise = go False acc cs

countCjkChars :: String -> Int
countCjkChars = length . filter isCjkChar

isLatinWordChar :: Char -> Bool
isLatinWordChar c = isAsciiLower (toLower c) || isNumber c || c == '\'' || c == '-'

isCjkChar :: Char -> Bool
isCjkChar c =
    let code = ord c
    in  (code >= 0x4E00  && code <= 0x9FFF)
     || (code >= 0x3400  && code <= 0x4DBF)
     || (code >= 0xF900  && code <= 0xFAFF)

escapeHtmlText :: String -> String
escapeHtmlText [] = []
escapeHtmlText (c:cs) = case c of
    '&'  -> "&amp;"  ++ escapeHtmlText cs
    '"'  -> "&quot;" ++ escapeHtmlText cs
    '<'  -> "&lt;"   ++ escapeHtmlText cs
    '>'  -> "&gt;"   ++ escapeHtmlText cs
    '\'' -> "&#39;"  ++ escapeHtmlText cs
    _    -> c : escapeHtmlText cs

escapeHtmlAttr :: String -> String
escapeHtmlAttr = escapeHtmlText

-- | Helper to transform root-relative URLs into absolute ones.
absolutizeUrls :: String -> String -> String
absolutizeUrls rootUrl = withUrls $ \url ->
    if "/" `isPrefixOf` url && not ("//" `isPrefixOf` url)
        then rootUrl ++ url
        else url
