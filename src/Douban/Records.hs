module Douban.Records
    ( Category(..)
    , RecordStatus(..)
    , DoubanRecord(..)
    , ImportWarning(..)
    , ImportResult(..)
    , categorySlug
    , categoryLabel
    , categoryDescription
    , statusLabel
    , loadDoubanDirectory
    , formatImportWarning
    ) where

import           Data.Char        (isDigit, isSpace, toLower)
import           Data.List        (elemIndex, intercalate, isInfixOf,
                                   isPrefixOf, isSuffixOf, maximumBy, sort)
import           Data.Maybe       (catMaybes, fromMaybe, mapMaybe)
import           System.Directory (doesDirectoryExist, doesFileExist,
                                   listDirectory)
import           System.FilePath  ((</>), takeFileName)

data Category
    = Book
    | Movie
    | Music
    | Game
    deriving (Eq, Ord, Show, Read, Enum, Bounded)

data RecordStatus
    = Done
    | Wishlist
    deriving (Eq, Ord, Show, Read)

data DoubanRecord = DoubanRecord
    { recordCategory    :: Category
    , recordStatus      :: RecordStatus
    , recordTitle       :: String
    , recordRating      :: Maybe Int
    , recordComment     :: Maybe String
    , recordLink        :: Maybe String
    , recordRecordedAt  :: Maybe String
    , recordSubjectDate :: Maybe String
    , recordCreator     :: Maybe String
    , recordSourceFile  :: FilePath
    , recordWarnings    :: [String]
    } deriving (Eq, Show)

data ImportWarning = ImportWarning
    { warningFile    :: FilePath
    , warningRow     :: Maybe Int
    , warningMessage :: String
    } deriving (Eq, Show)

data ImportResult = ImportResult
    { importRecords  :: [DoubanRecord]
    , importWarnings :: [ImportWarning]
    , importSources  :: [(Category, RecordStatus, FilePath)]
    } deriving (Eq, Show)

data FieldKey
    = FieldTitle
    | FieldRating
    | FieldRecordedAt
    | FieldComment
    | FieldSubjectDate
    | FieldCreator
    | FieldLink
    deriving (Eq, Ord, Show)

categorySlug :: Category -> String
categorySlug category = case category of
    Book  -> "books"
    Movie -> "movies"
    Music -> "music"
    Game  -> "games"

categoryLabel :: Category -> String
categoryLabel category = case category of
    Book  -> "Books"
    Movie -> "Movies"
    Music -> "Music"
    Game  -> "Games"

categoryDescription :: Category -> String
categoryDescription category = case category of
    Book  -> "Books and essays."
    Movie -> "Films and series."
    Music -> "Albums, singles, soundtracks."
    Game  -> "Video games and occasional board games."

statusLabel :: RecordStatus -> String
statusLabel status = case status of
    Done     -> "Done"
    Wishlist -> "Wishlist"

loadDoubanDirectory :: FilePath -> IO ImportResult
loadDoubanDirectory root = do
    exists <- doesDirectoryExist root
    if not exists
        then return $ ImportResult [] [] []
        else do
            files <- listCsvFilesRecursive root
            let selected = selectLatestSources files
            parsed <- mapM parseSelectedSource selected
            return $ ImportResult
                { importRecords = concatMap (\(_, _, _, records, _) -> records) parsed
                , importWarnings = concatMap (\(_, _, _, _, warnings) -> warnings) parsed
                , importSources = [ (category, status, path) | (category, status, path, _, _) <- parsed ]
                }

formatImportWarning :: ImportWarning -> String
formatImportWarning warning =
    "[douban] "
        ++ warningFile warning
        ++ maybe "" (\rowNumber -> ":" ++ show rowNumber) (warningRow warning)
        ++ " - "
        ++ warningMessage warning

parseSelectedSource
    :: (Category, RecordStatus, FilePath)
    -> IO (Category, RecordStatus, FilePath, [DoubanRecord], [ImportWarning])
parseSelectedSource (category, status, path) = do
    exists <- doesFileExist path
    if not exists
        then return (category, status, path, [], [ImportWarning path Nothing "CSV file not found. Rendering empty section."])
        else do
            raw <- readFile path
            let content = stripBom raw
            case parseCsv content of
                Left parseError ->
                    return (category, status, path, [], [ImportWarning path Nothing ("Could not parse CSV: " ++ parseError ++ ". Rendering empty section.")])
                Right rows ->
                    let (records, warnings) = rowsToRecords category status path rows
                    in return (category, status, path, records, warnings)

rowsToRecords :: Category -> RecordStatus -> FilePath -> [[String]] -> ([DoubanRecord], [ImportWarning])
rowsToRecords category status path rows =
    case rows of
        [] -> ([], [])
        (headerRow:bodyRows) ->
            let adjustedHeader = adjustHeaderForWishlist headerRow bodyRows
                normalizedHeader = map normalizeHeader adjustedHeader
                indexedRows = zip [2 ..] bodyRows
                parsedRows = map (rowToRecord category status path normalizedHeader) indexedRows
                nonFatalWarnings = concatMap snd parsedRows
                records = catMaybes (map (fst . fst) parsedRows)
            in (records, nonFatalWarnings)

rowToRecord
    :: Category
    -> RecordStatus
    -> FilePath
    -> [String]
    -> (Int, [String])
    -> ((Maybe DoubanRecord, [String]), [ImportWarning])
rowToRecord category status path header (rowNumber, rowValues)
    | all (null . trim) rowValues = ((Nothing, []), [])
    | otherwise =
        let pairs = zip header rowValues
            valueFor key = lookupFieldValue category key pairs
            titleValue = valueFor FieldTitle
            ratingWarnings = case valueFor FieldRating of
                Just ratingText ->
                    case parseRating ratingText of
                        Left warningText -> ([warningText], Nothing)
                        Right ratingValue -> ([], ratingValue)
                Nothing -> ([], Nothing)
            recordWarnings' = fst ratingWarnings
            recordLevelWarnings = localWarnings ++ recordWarnings'
            localWarnings = [ "Row has fewer columns than expected; missing values were treated as empty."
                            | length rowValues < length header
                            ]
            warnings = map (\message -> ImportWarning path (Just rowNumber) message) recordLevelWarnings
        in case titleValue of
            Nothing ->
                ((Nothing, []), warnings ++ [ImportWarning path (Just rowNumber) "Skipped row because title is empty."])
            Just titleText ->
                let cleanComment = fmap stripUsefulSuffix (valueFor FieldComment)
                    record = DoubanRecord
                        { recordCategory = category
                        , recordStatus = status
                        , recordTitle = titleText
                        , recordRating = snd ratingWarnings
                        , recordComment = cleanComment
                        , recordLink = valueFor FieldLink
                        , recordRecordedAt = valueFor FieldRecordedAt
                        , recordSubjectDate = valueFor FieldSubjectDate
                        , recordCreator = valueFor FieldCreator
                        , recordSourceFile = path
                        , recordWarnings = recordLevelWarnings
                        }
                in ((Just record, recordLevelWarnings), warnings)

lookupFieldValue :: Category -> FieldKey -> [(String, String)] -> Maybe String
lookupFieldValue category fieldKey pairs =
    firstNonEmptyValue [ lookup normalizedName pairs | normalizedName <- aliasesFor category fieldKey ]

aliasesFor :: Category -> FieldKey -> [String]
aliasesFor category fieldKey = case fieldKey of
    FieldTitle      -> map normalizeHeader titleAliases
    FieldRating     -> map normalizeHeader ["个人评分"]
    FieldRecordedAt -> map normalizeHeader ["打分日期"]
    FieldComment    -> map normalizeHeader ["我的短评"]
    FieldSubjectDate -> map normalizeHeader $ case category of
        Book  -> ["出版日期"]
        Movie -> ["上映日期"]
        Music -> ["发行日期"]
        Game  -> ["发行日期"]
    FieldCreator -> map normalizeHeader $ case category of
        Book  -> ["作者"]
        Movie -> ["导演", "导演 / 主演"]
        Music -> ["音乐家"]
        Game  -> []
    FieldLink -> map normalizeHeader ["条目链接"]

titleAliases :: [String]
titleAliases =
    [ "书名"
    , "电影/电视剧/番组"
    , "单曲/专辑"
    , "游戏名称"
    ]

parseRating :: String -> Either String (Maybe Int)
parseRating raw =
    let cleaned = trim raw
    in if null cleaned
        then Right Nothing
        else if all isDigit cleaned
            then let ratingValue = read cleaned
                 in if ratingValue >= 1 && ratingValue <= 5
                        then Right (Just ratingValue)
                        else Left ("Rating out of range: " ++ cleaned)
            else Left ("Could not parse rating: " ++ cleaned)

firstNonEmptyValue :: [Maybe String] -> Maybe String
firstNonEmptyValue [] = Nothing
firstNonEmptyValue (candidate:rest) =
    case candidate >>= normalizeValue of
        Just value -> Just value
        Nothing    -> firstNonEmptyValue rest

normalizeValue :: String -> Maybe String
normalizeValue value =
    let cleaned = trim value
    in if null cleaned then Nothing else Just cleaned

normalizeHeader :: String -> String
normalizeHeader =
    map toLower
    . filter (not . isSpace)
    . stripBom
    . trim

adjustHeaderForWishlist :: [String] -> [[String]] -> [String]
adjustHeaderForWishlist header rows =
    case elemIndex (normalizeHeader "标题") normalizedHeader of
        Nothing -> header
        Just index
            | shouldDropWishlistPlaceholder -> removeAt index header
            | otherwise -> header
  where
    normalizedHeader = map normalizeHeader header
    meaningfulRows = filter (not . all (null . trim)) rows
    shouldDropWishlistPlaceholder =
        not (null meaningfulRows)
        && all (\row -> length row == length header - 1) meaningfulRows

selectLatestSources :: [FilePath] -> [(Category, RecordStatus, FilePath)]
selectLatestSources files =
    mapMaybe chooseLatestFile allSlots
  where
    allSlots = [ (category, status) | category <- [minBound .. maxBound], status <- [Done, Wishlist] ]
    chooseLatestFile (category, status) =
        let matches = [ path | path <- files, classifyCsvFile path == Just (category, status) ]
        in case matches of
            [] -> Nothing
            _  -> Just (category, status, maximumBy compare matches)

classifyCsvFile :: FilePath -> Maybe (Category, RecordStatus)
classifyCsvFile path =
    let name = map toLower (takeFileName path)
        status = if "wishlist" `isInfixOf` name then Wishlist else Done
        category
            | "db-book" `isInfixOf` name = Just Book
            | "db-movie" `isInfixOf` name = Just Movie
            | "db-music" `isInfixOf` name = Just Music
            | "db-game" `isInfixOf` name = Just Game
            | otherwise = Nothing
    in fmap (\resolvedCategory -> (resolvedCategory, status)) category

listCsvFilesRecursive :: FilePath -> IO [FilePath]
listCsvFilesRecursive root = do
    children <- sort <$> listDirectory root
    nested <- mapM visit children
    return (concat nested)
  where
    visit name = do
        let path = root </> name
        isDirectory <- doesDirectoryExist path
        if isDirectory
            then listCsvFilesRecursive path
            else return [ path | ".csv" `isSuffixOf` map toLower name ]

stripBom :: String -> String
stripBom ('\xfeff':rest) = rest
stripBom value = value

trim :: String -> String
trim = dropWhileEnd isSpace . dropWhile isSpace

dropWhileEnd :: (a -> Bool) -> [a] -> [a]
dropWhileEnd predicate = reverse . dropWhile predicate . reverse

removeAt :: Int -> [a] -> [a]
removeAt index values =
    let (before, after) = splitAt index values
    in before ++ drop 1 after

parseCsv :: String -> Either String [[String]]
parseCsv input = parseRows [] [] [] False input

parseRows :: [[String]] -> [String] -> String -> Bool -> String -> Either String [[String]]
parseRows rows currentRow currentField inQuotes remaining =
    case remaining of
        [] ->
            if inQuotes
                then Left "Reached end of file while still inside a quoted field"
                else
                    let completedField = reverse currentField
                        completedRow = currentRow ++ [completedField]
                        finalRows
                            | null completedRow || (length completedRow == 1 && null (head completedRow) && null rows) = rows
                            | otherwise = rows ++ [completedRow]
                    in Right finalRows
        ('"':'"':rest)
            | inQuotes -> parseRows rows currentRow ('"':currentField) True rest
        ('"':rest) -> parseRows rows currentRow currentField (not inQuotes) rest
        (',':rest)
            | not inQuotes ->
                let completedField = reverse currentField
                in parseRows rows (currentRow ++ [completedField]) [] False rest
        ('\r':'\n':rest)
            | not inQuotes ->
                let completedField = reverse currentField
                    completedRow = currentRow ++ [completedField]
                in parseRows (rows ++ [completedRow]) [] [] False rest
        ('\n':rest)
            | not inQuotes ->
                let completedField = reverse currentField
                    completedRow = currentRow ++ [completedField]
                in parseRows (rows ++ [completedRow]) [] [] False rest
        ('\r':rest)
            | not inQuotes ->
                let completedField = reverse currentField
                    completedRow = currentRow ++ [completedField]
                in parseRows (rows ++ [completedRow]) [] [] False rest
        (char:rest) -> parseRows rows currentRow (char:currentField) inQuotes rest

-- | Strips patterns like "(1 有用)" or "(11 有用)" from the end of a comment.
stripUsefulSuffix :: String -> String
stripUsefulSuffix str =
    let trimmed = trim str
    in case reverse trimmed of
        (')':rest) ->
            let (suffix, original) = span (/= '(') rest
                -- suffix is something like "用有 7" or "论评 3"
            in if any (`isPrefixOf` suffix) ["用有", "论评"]
                then trim (reverse (drop 1 original))
                else trimmed
        _ -> trimmed
