module Main where

import           Douban.Records     (Category (..), ImportResult (..),
                                     RecordStatus (..), categoryLabel,
                                     formatImportWarning, loadDoubanDirectory,
                                     recordCategory, recordStatus)
import           Data.List          (intercalate)
import           System.Environment (getArgs)

main :: IO ()
main = do
    args <- getArgs
    let root = case args of
            []      -> "assets/douban"
            (x : _) -> x
    result <- loadDoubanDirectory root
    putStrLn $ "Douban import root: " ++ root
    putStrLn $ "Selected sources: " ++ show (length (importSources result))
    putStrLn $ intercalate "\n" (map (summarizeCategory result) [Book, Movie, Music, Game])
    if null (importWarnings result)
        then putStrLn "Warnings: none"
        else do
            putStrLn "Warnings:"
            mapM_ (putStrLn . ("  - " ++) . formatImportWarning) (importWarnings result)

summarizeCategory :: ImportResult -> Category -> String
summarizeCategory result category =
    let doneCount = countRecords result category Done
        wishlistCount = countRecords result category Wishlist
    in categoryLabel category ++ ": done=" ++ show doneCount ++ ", wishlist=" ++ show wishlistCount

countRecords :: ImportResult -> Category -> RecordStatus -> Int
countRecords result category status =
    length
        [ ()
        | record <- importRecords result
        , recordCategory record == category
        , recordStatus record == status
        ]
