-- | Day-by-day heatmaps of Douban records.
--
-- Everything is rendered to static HTML at build time. Each cell carries
-- per-category counts (and, when non-empty, a compact list of entries) in
-- data attributes, so @js/heatmap.js@ can show what was marked on a day and
-- recolour the grid by category. Without JavaScript the grids still render.
module Douban.Heatmap
    ( recentHeatmapHtml
    , recentHeatmapTotal
    , yearHeatmapsHtml
    ) where

import           Data.Char       (isAsciiLower, isAsciiUpper, isDigit,
                                  isSpace)
import           Data.List       (intercalate, isPrefixOf, nub, sortBy)
import           Data.Maybe      (fromMaybe, mapMaybe)
import           Data.Ord        (Down (..), comparing)
import           Data.Time       (Day, addDays, diffDays, fromGregorian,
                                  fromGregorianValid, showGregorian,
                                  toGregorian)
import           Douban.Records  (Category (..), DoubanRecord (..),
                                  RecordStatus (..))
import           Site.Utils      (escapeHtmlAttr, escapeHtmlText)

data Entry = Entry
    { entryDay      :: Day
    , entryCat      :: Category
    , entryTitle    :: String   -- ^ Chinese title as listed on Douban
    , entryOriginal :: String   -- ^ original title, empty when none is given
    , entryRating   :: Maybe Int
    }

--------------------------------------------------------------------------------
-- Public API

-- | Fifty-three weeks ending with the week of the most recent record.
recentHeatmapHtml :: [DoubanRecord] -> String
recentHeatmapHtml records =
    case latestDay es of
        Nothing      -> ""
        Just endDay  ->
            let lastMonday  = mondayOnOrBefore endDay
                firstMonday = addDays (-(7 * 52)) lastMonday
                inRange d   = d >= firstMonday && d <= endDay
            in  gridHtml "hm-recent" es firstMonday 53 inRange
                    (monthLabelsRolling firstMonday 53)
  where
    es = entries records

-- | Number of records shown in 'recentHeatmapHtml'.
recentHeatmapTotal :: [DoubanRecord] -> String
recentHeatmapTotal records =
    case latestDay es of
        Nothing     -> "0"
        Just endDay ->
            let firstMonday = addDays (-(7 * 52)) (mondayOnOrBefore endDay)
            in  show (length [ e | e <- es, entryDay e >= firstMonday ])
  where
    es = entries records

-- | One grid per calendar year, newest first.
yearHeatmapsHtml :: [DoubanRecord] -> String
yearHeatmapsHtml records =
    case latestDay es of
        Nothing     -> ""
        Just endDay -> concatMap (yearBlock es endDay) years
  where
    es = entries records
    years = sortBy (comparing Down) . nub $ map (yearOf . entryDay) es

--------------------------------------------------------------------------------
-- Rendering

yearBlock :: [Entry] -> Day -> Integer -> String
yearBlock es endDay year =
    let jan1        = fromGregorian year 1 1
        dec31       = fromGregorian year 12 31
        firstMonday = mondayOnOrBefore jan1
        lastSunday  = addDays 6 (mondayOnOrBefore dec31)
        weeks       = fromInteger (diffDays lastSunday firstMonday `div` 7) + 1
        inRange d   = d >= jan1 && d <= dec31 && d <= endDay
        inYear      = [ e | e <- es, yearOf (entryDay e) == year ]
        count c     = length [ e | e <- inYear, entryCat e == c ]
        partial     = yearOf endDay == year && endDay < dec31
        labels      = [ (fromInteger (diffDays (fromGregorian year m 1) firstMonday `div` 7) + 1, monthName m)
                      | m <- [1 .. 12] ]
        sumAll      = summaryAll year (length inYear) [ (c, count c) | c <- [Movie, Book, Music, Game] ] partial endDay
        sumFor c    = summaryOne year c (count c) partial endDay
    in  concat
            [ "<section class=\"hm-year\" data-year=\"", show year, "\">"
            , "<div class=\"hm-year-head\">"
            , "<p class=\"hm-year-title\">", show year, "</p>"
            , "<p class=\"hm-sum\""
            , " data-sum-all=\"", escapeHtmlAttr sumAll, "\""
            , concat [ " data-sum-" ++ catKey c ++ "=\"" ++ escapeHtmlAttr (sumFor c) ++ "\"" | c <- [Book, Movie, Music, Game] ]
            , ">", escapeHtmlText sumAll, "</p>"
            , "</div>"
            , gridHtml "hm-year-grid" es firstMonday weeks inRange labels
            , "</section>"
            ]

gridHtml :: String -> [Entry] -> Day -> Int -> (Day -> Bool) -> [(Int, String)] -> String
gridHtml extraClass es firstMonday weeks inRange labels =
    concat
        [ "<div class=\"hm ", extraClass, "\" style=\"--hm-weeks: ", show weeks, "\">"
        , "<div class=\"hm-scroll\">"
        , "<div class=\"hm-months\" aria-hidden=\"true\">"
        , concat [ "<span style=\"grid-column: " ++ show col ++ " / span 4\">" ++ name ++ "</span>"
                 | (col, name) <- labels, col >= 1, col <= weeks - 2 ]
        , "</div>"
        , "<div class=\"hm-grid\">"
        , concatMap (cellHtml inRange dayEntries) days
        , "</div>"
        , "</div>"
        , "</div>"
        ]
  where
    days = [ addDays i firstMonday | i <- [0 .. toInteger (weeks * 7) - 1] ]
    windowEntries = [ e | e <- es, inRange (entryDay e) ]
    dayEntries d = [ e | e <- windowEntries, entryDay e == d ]

cellHtml :: (Day -> Bool) -> (Day -> [Entry]) -> Day -> String
cellHtml inRange dayEntries d
    | not (inRange d) = "<span class=\"hm-cell hm-out\"></span>"
    | null es = "<span class=\"hm-cell\"></span>"
    | otherwise =
        concat
            [ "<span class=\"hm-cell hm-on\""
            , cellStyle counts
            , " data-date=\"", showGregorian d, "\""
            , concat [ " data-" ++ catKey c ++ "=\"" ++ show k ++ "\"" | (c, k) <- counts, k > 0 ]
            , " data-items=\"", escapeHtmlAttr (intercalate "\n" (map itemLine es)), "\""
            , " title=\"", escapeHtmlAttr (showGregorian d ++ ": " ++ intercalate ", " (map displayTitle es)), "\""
            , "></span>"
            ]
  where
    es = dayEntries d
    counts = [ (c, length [ e | e <- es, entryCat e == c ]) | c <- stripeOrder ]
    itemLine e = catKey (entryCat e) ++ "|" ++ maybe "" show (entryRating e)
        ++ "|" ++ entryOriginal e ++ "|" ++ entryTitle e
    displayTitle e = if null (entryOriginal e) then entryTitle e else entryOriginal e

-- | Order of the stripes when one day holds several categories.
stripeOrder :: [Category]
stripeOrder = [Movie, Book, Music, Game]

-- | Colour a day the way Douban does: one hue per category, three shades
-- (one, two, three or more entries), and horizontal stripes when a day
-- holds several categories. The colours live in CSS variables
-- (--hm-film-1 and so on, see css/records.css).
cellStyle :: [(Category, Int)] -> String
cellStyle counts =
    case [ (c, k) | (c, k) <- counts, k > 0 ] of
        []      -> ""
        [(c, k)] -> " style=\"background: " ++ swatch c k ++ "\""
        parts   ->
            let n = length parts
                stop i = show ((i * 100) `div` n) ++ "%"
                segment (i, (c, k)) = swatch c k ++ " " ++ stop i ++ " " ++ stop (i + 1)
            in  " style=\"background: linear-gradient(" ++ intercalate ", " (map segment (zip [0 :: Int ..] parts)) ++ ")\""
  where
    swatch c k = "var(--hm-" ++ catKey c ++ "-" ++ show (min 3 k) ++ ")"

monthLabelsRolling :: Day -> Int -> [(Int, String)]
monthLabelsRolling firstMonday weeks = go 0 Nothing
  where
    go col prev
        | col >= weeks = []
        | otherwise =
            let (_, m, _) = toGregorian (addDays (toInteger (7 * col)) firstMonday)
            in  if Just m /= prev
                    then (col + 1, monthName m) : go (col + 1) (Just m)
                    else go (col + 1) prev

--------------------------------------------------------------------------------
-- Summaries

summaryAll :: Integer -> Int -> [(Category, Int)] -> Bool -> Day -> String
summaryAll year total parts partial endDay =
    let listed = [ plural k (noun c) | (c, k) <- parts, k > 0 ]
        body = "In " ++ show year ++ " I marked " ++ plural total ("thing", "things")
            ++ (if null listed then "." else ": " ++ intercalate ", " listed ++ ".")
    in  body ++ partialNote partial endDay

summaryOne :: Integer -> Category -> Int -> Bool -> Day -> String
summaryOne year c k partial endDay =
    "In " ++ show year ++ " I marked " ++ plural k (noun c) ++ "." ++ partialNote partial endDay

partialNote :: Bool -> Day -> String
partialNote partial endDay
    | partial   = let (_, m, _) = toGregorian endDay
                  in  " This archive stops in " ++ monthLongName m ++ "."
    | otherwise = ""

noun :: Category -> (String, String)
noun c = case c of
    Movie -> ("film", "films")
    Book  -> ("book", "books")
    Music -> ("album or song", "albums and songs")
    Game  -> ("game", "games")

plural :: Int -> (String, String) -> String
plural k (one, many) = show k ++ " " ++ (if k == 1 then one else many)

--------------------------------------------------------------------------------
-- Helpers

entries :: [DoubanRecord] -> [Entry]
entries = mapMaybe toEntry
  where
    toEntry r
        | recordStatus r /= Done = Nothing
        | otherwise = do
            d <- recordRecordedAt r >>= parseDay
            let (zh, original) = splitTitles (recordTitle r)
            return Entry
                { entryDay = d
                , entryCat = recordCategory r
                , entryTitle = zh
                , entryOriginal = original
                , entryRating = recordRating r
                }

latestDay :: [Entry] -> Maybe Day
latestDay [] = Nothing
latestDay es = Just (maximum (map entryDay es))

-- | Accepts "2026/04/11", "2026/4/1", "2026-04-11" and ignores a time part.
parseDay :: String -> Maybe Day
parseDay raw =
    case words (map sep (takeWhile (not . isSpace) (dropWhile isSpace raw))) of
        [y, m, d] | all (\p -> not (null p) && all isDigit p) [y, m, d] ->
            fromGregorianValid (read y) (read m) (read d)
        _ -> Nothing
  where
    sep c = if c == '/' || c == '-' then ' ' else c

-- | Split a Douban title into (Chinese title, original title).
--
-- Films and books read "局外人 / L'Étranger". Games put the original after a
-- space, as in "镇民纪 Townsfolk" or "超级马力欧世界 スーパーマリオワールド":
-- the original starts at the first word that begins with a Latin letter or
-- holds kana, right after a word containing a Han character. Titles with no
-- separate original come back with an empty second part.
splitTitles :: String -> (String, String)
splitTitles raw =
    case breakOn " / " raw of
        Just (a, b)
            -- Music lists the original first: keep the Han side as the
            -- Chinese title whichever side it is on.
            | not (any isHan a) && any isHan b -> (trimBoth b, trimBoth a)
            | otherwise                        -> (trimBoth a, trimBoth b)
        Nothing ->
            let ws = words raw
                splits = [ i | i <- [1 .. length ws - 1]
                             , foreignStart (ws !! i)
                             , any isHan (ws !! (i - 1)) ]
            in  case splits of
                    (i : _) -> (unwords (take i ws), unwords (drop i ws))
                    []      -> (trimBoth raw, "")
  where
    breakOn sep = go ""
      where
        go acc rest
            | sep `isPrefixOf` rest = Just (reverse acc, drop (length sep) rest)
        go acc (c:cs) = go (c : acc) cs
        go _ [] = Nothing
    trimBoth = dropWhile isSpace . reverse . dropWhile isSpace . reverse
    isHan c = c >= '\x4e00' && c <= '\x9fff'
    isKana c = c >= '\x3040' && c <= '\x30ff'
    isLatin c = isAsciiUpper c || isAsciiLower c
    foreignStart w = case w of
        (c:_) | isLatin c -> True
        _                 -> any isKana w

mondayOnOrBefore :: Day -> Day
mondayOnOrBefore d = addDays (negate (weekdayIndex d)) d

-- | 0 for Monday through 6 for Sunday. 1970-01-05 was a Monday.
weekdayIndex :: Day -> Integer
weekdayIndex d = diffDays d (fromGregorian 1970 1 5) `mod` 7

yearOf :: Day -> Integer
yearOf d = let (y, _, _) = toGregorian d in y

catKey :: Category -> String
catKey c = case c of
    Book  -> "book"
    Movie -> "film"
    Music -> "music"
    Game  -> "game"

monthName :: Int -> String
monthName m = fromMaybe "" (lookup m (zip [1 ..] ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]))

monthLongName :: Int -> String
monthLongName m = fromMaybe "" (lookup m (zip [1 ..] ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]))
