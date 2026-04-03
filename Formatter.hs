{-# LANGUAGE OverloadedStrings #-}
import qualified Data.Text as T
import qualified Data.Text.IO as TIO
import System.Directory (listDirectory, doesDirectoryExist)
import System.FilePath ((</>), takeExtension)
import System.Environment (getArgs)
import Data.Char (isDigit)
import Control.Monad (forM, forM_)

--------------------------------------------------------------------------------
-- Typography Rules
--------------------------------------------------------------------------------

-- Only actual Chinese characters trigger spacing rules.
-- Punctuation (（）、。：「」 etc.) is intentionally excluded so that
-- e.g. "（English）" does NOT get spaces inserted around the brackets.
isChinese :: Char -> Bool
isChinese c =
    (c >= '\x4E00' && c <= '\x9FFF')  -- 基本汉字
 || (c >= '\x3400' && c <= '\x4DBF')  -- 扩展A

isLatinish :: Char -> Bool
isLatinish c = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
            || c == '(' || c == ')' || c == '[' || c == ']'

needsSpace :: Char -> Char -> Bool
needsSpace x y =
    (isChinese x && (isLatinish y || y == '$')) ||
    ((isLatinish x || x == '$') && isChinese y)

-- Fix CJK/Latin spacing, but skip content inside backticks (inline code)
fixSpacing :: T.Text -> T.Text
fixSpacing t = T.pack $ go False (T.unpack t)
  where
    go _ [] = []
    go inCode ('`':xs) = '`' : go (not inCode) xs
    go True  (x:xs)    = x : go True xs       -- inside inline code, pass through
    go False (x:' ':y:zs)
        | isChinese x && isChinese y           -- remove spurious space between CJK chars
                         = x : go False (y:zs)
    go False (x:y:zs)
        | needsSpace x y = x : ' ' : go False (y:zs)  -- insert space CJK<->Latin
        | otherwise      = x : go False (y:zs)
    go False (x:xs)    = x : go False xs

-- Ensure "##title" becomes "## title"
fixHeading :: T.Text -> T.Text
fixHeading t =
    let s              = T.strip t
        (hashes, rest) = T.span (== '#') s
    in if T.null hashes || T.null rest || " " `T.isPrefixOf` rest || T.length hashes == 1
       then t
       else hashes <> " " <> rest

-- Split display math that is inline (not on its own line) onto separate lines
fixDisplayMath :: [T.Text] -> [T.Text]
fixDisplayMath [] = []
fixDisplayMath (l:ls) =
    if "$$" `T.isInfixOf` l && not ("$$" `T.isPrefixOf` T.strip l)
    then
        let parts = T.splitOn "$$" l
            reform []        = []
            reform [p]       = [p]
            reform (p1:p2:ps) = p1 : "" : "$$" : p2 : "$$" : "" : reform ps
        in filter (not . T.null) (reform parts) ++ fixDisplayMath ls
    else l : fixDisplayMath ls

--------------------------------------------------------------------------------
-- Block-level blank-line insertion (now state-aware)
--------------------------------------------------------------------------------

isHeader :: T.Text -> Bool
isHeader t =
    let s              = T.strip t
        (hashes, rest) = T.span (== '#') s
    in not (T.null hashes) && " " `T.isPrefixOf` rest

-- More accurate ordered-list detection: digits followed immediately by '.'
isOrderedItem :: T.Text -> Bool
isOrderedItem t =
    let s = T.strip t
        (digits, rest) = T.span isDigit s
    in not (T.null digits) && ". " `T.isPrefixOf` rest

isListItem :: T.Text -> Bool
isListItem t =
    let s = T.strip t
    in  "* " `T.isPrefixOf` s
     || "- " `T.isPrefixOf` s
     || "+ " `T.isPrefixOf` s
     || isOrderedItem t

shouldInsertBlank :: T.Text -> T.Text -> Bool
shouldInsertBlank a b
    | T.null (T.strip a) || T.null (T.strip b) = False
    | isHeader b && not (isHeader a)            = True
    | isHeader a && not (isHeader b)            = True
    | isListItem b && not (isListItem a)        = True
    | isListItem a && not (isListItem b)        = True
    | otherwise                                 = False

--------------------------------------------------------------------------------
-- Stateful Processor
-- Handles: code blocks, manual disable regions, spacing, block insertion
--------------------------------------------------------------------------------

data State = State
    { inCodeBlock        :: Bool
    , isManuallyDisabled :: Bool
    }

initialState :: State
initialState = State False False

processLines :: State -> [T.Text] -> [T.Text]
processLines _  []     = []
processLines st (l:ls) =
    let s         = T.strip l
        isCB      = "```" `T.isPrefixOf` s || "~~~" `T.isPrefixOf` s
        isDisable = "<!-- formatter-disable -->" `T.isInfixOf` l
        isEnable  = "<!-- formatter-enable -->"  `T.isInfixOf` l

        -- Update state BEFORE processing so that the opening ``` line itself
        -- is not mangled, and the closing ``` line exits code mode correctly.
        newCB       = if isCB then not (inCodeBlock st) else inCodeBlock st
        newDisabled = if isDisable then True
                      else if isEnable then False
                      else isManuallyDisabled st
        nextSt = State newCB newDisabled

        -- Only apply typography fixes when outside code blocks and not disabled
        shouldFormat = not (inCodeBlock st) && not (isManuallyDisabled st)
        formattedLine = if shouldFormat then fixHeading (fixSpacing l) else l

        rest = processLines nextSt ls

        -- Insert blank line before next line only when:
        --   1. we are NOT in a code block
        --   2. formatting is not disabled
        --   3. the rule fires
        needsBlank =
            shouldFormat &&
            not (inCodeBlock nextSt) &&
            not (null rest) &&
            shouldInsertBlank formattedLine (head rest)

    in if needsBlank
       then formattedLine : "" : rest
       else formattedLine : rest

--------------------------------------------------------------------------------
-- YAML / TOML frontmatter splitter
--------------------------------------------------------------------------------

-- Supports both --- (YAML) and +++ (TOML) frontmatter
splitFrontmatter :: [T.Text] -> ([T.Text], [T.Text])
splitFrontmatter ls = case ls of
    (l:rest) | delim l ->
        let (fm, remaining) = break delim rest
        in  if null remaining
              then ([], ls)                            -- unclosed frontmatter
              else (l : fm ++ [head remaining], tail remaining)
    _ -> ([], ls)
  where
    delim x = T.strip x == "---" || T.strip x == "+++"

--------------------------------------------------------------------------------
-- Main pipeline
--------------------------------------------------------------------------------

formatFileContent :: [T.Text] -> [T.Text]
formatFileContent ls =
    let (fm, content) = splitFrontmatter ls
        spaced        = processLines initialState content   -- spacing + blank lines
        mathFixed     = fixDisplayMath spaced
    in  fm ++ mathFixed

--------------------------------------------------------------------------------
-- IO
--------------------------------------------------------------------------------

getMarkdownFiles :: FilePath -> IO [FilePath]
getMarkdownFiles dir = do
    entries <- listDirectory dir
    let filtered = filter (`notElem`
            [".git", "_site", "_cache", "dist-newstyle", "node_modules"]) entries
    files <- forM filtered $ \name -> do
        let path = dir </> name
        isDir <- doesDirectoryExist path
        if isDir
            then getMarkdownFiles path
            else return [ path | takeExtension name `elem` [".md", ".markdown"] ]
    return (concat files)

processFile :: Bool -> FilePath -> IO ()
processFile dryRun path = do
    original <- TIO.readFile path
    let ls         = T.lines original
        newLines   = formatFileContent ls
        -- Preserve whether the original file ended with a newline
        newContent = let joined = T.unlines newLines
                     in if T.isSuffixOf "\n" original then joined
                        else T.dropEnd 1 joined
    if original == newContent
        then return ()
        else if dryRun
               then do
                   putStrLn $ bold ("[dry-run] " ++ path)
                   putStr $ showDiff path ls newLines
               else do
                   putStrLn $ "formatting: " ++ path
                   TIO.writeFile path newContent

-- ANSI color helpers
red, green, yellow, bold :: String -> String
red    s = "\ESC[31m" ++ s ++ "\ESC[0m"
green  s = "\ESC[32m" ++ s ++ "\ESC[0m"
yellow s = "\ESC[33m" ++ s ++ "\ESC[0m"
bold   s = "\ESC[1m"  ++ s ++ "\ESC[0m"

-- Jump to line format: path:line
termLink :: FilePath -> Int -> String -> String
termLink path lineNum _ = path ++ ":" ++ show lineNum

showDiff :: FilePath -> [T.Text] -> [T.Text] -> String
showDiff path old new =
    let indexed = zip3 [(1::Int)..] old new
        changed  = filter (\(_,a,b) -> a /= b) indexed
    in if null changed
       then ""
       else unlines
            [ bold (yellow (termLink path n ("line " ++ show n))) ++ "\n"
              ++ red   ("  - " ++ T.unpack a) ++ "\n"
              ++ green ("  + " ++ T.unpack b)
            | (n, a, b) <- changed ]

main :: IO ()
main = do
    args <- getArgs
    let dryRun = "--dry-run" `elem` args
    putStrLn $ if dryRun then "dry-run mode" else "formatting..."
    files <- getMarkdownFiles "."
    forM_ files (processFile dryRun)
    putStrLn "done."