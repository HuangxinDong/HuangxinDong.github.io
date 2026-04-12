{-# LANGUAGE OverloadedStrings #-}
module Douban.UI
    ( doubanRecordCtx
    , doubanStatusPageCtx
    , doubanIndexCtx
    , renderStars
    , doneLabel
    , extractArchiveDate
    ) where

import           Control.Applicative (empty)
import           Data.Char        (isNumber, toLower)
import           Data.Maybe       (fromMaybe, isJust)
import           Douban.Records   (Category (..), DoubanRecord (..),
                                   ImportResult (..), RecordStatus (..),
                                   categoryDescription, categoryLabel,
                                   categorySlug, statusLabel)
import           Hakyll
import           Site.Utils       (escapeHtmlAttr, escapeHtmlText)
import           System.FilePath  (takeBaseName)

-- | Context for an individual record card.
doubanRecordCtx :: RecordStatus -> Context DoubanRecord
doubanRecordCtx status =
    field "title" (return . recordTitle . itemBody) `mappend`
    field "rating" (return . maybe "" show . recordRating . itemBody) `mappend`
    field "stars" (return . maybe "" renderStars . recordRating . itemBody) `mappend`
    field "comment" (return . fromMaybe "" . recordComment . itemBody) `mappend`
    field "hasComment" (\item -> if isJust (recordComment (itemBody item)) then return "true" else empty) `mappend`
    field "link" (return . fromMaybe "" . recordLink . itemBody) `mappend`
    field "hasLink" (\item -> if isJust (recordLink (itemBody item)) then return "true" else empty) `mappend`
    field "recordedAt" (return . fromMaybe "" . recordRecordedAt . itemBody) `mappend`
    field "subjectDate" (return . fromMaybe "" . recordSubjectDate . itemBody) `mappend`
    field "creator" (return . fromMaybe "" . recordCreator . itemBody) `mappend`
    field "hasCreator" (\item -> if isJust (recordCreator (itemBody item)) then return "true" else empty) `mappend`
    field "subjectLabel" (return . getSubjectLabel . recordCategory . itemBody) `mappend`
    field "ratingValue" (return . maybe "" show . recordRating . itemBody) `mappend`
    constField "isDone" (if status == Done then "true" else "") `mappend`
    constField "isWishlist" (if status == Wishlist then "true" else "")
  where
    isJust (Just _) = True
    isJust Nothing  = False
    getSubjectLabel cat = case cat of
        Book  -> "Published"
        Movie -> "Released"
        Music -> "Released"
        Game  -> "Released"

-- | Context for a status-specific records page (e.g. Watched Movies).
doubanStatusPageCtx :: ImportResult -> Category -> RecordStatus -> Context String -> Context String
doubanStatusPageCtx imported category status baseCtx =
    constField "title" pageTitle `mappend`
    constField "categoryLabel" (categoryLabel category) `mappend`
    constField "categoryDescription" (categoryDescription category) `mappend`
    constField "categorySlug" (categorySlug category) `mappend`
    constField "statusLabel" (statusLabel status) `mappend`
    constField "archiveDate" (extractArchiveDate sources) `mappend`
    listField "records" (doubanRecordCtx status) (mapM makeItem targetedRecords) `mappend`
    constField "recordCount" (show $ length targetedRecords) `mappend`
    constField "countMoreThanOne" (if length targetedRecords /= 1 then "true" else "") `mappend`
    constField "doneLabel" (doneLabel category) `mappend`
    constField "showFilter" (if showFilter then "true" else "") `mappend`
    boolField "isDone" (const $ status == Done) `mappend`
    boolField "isWishlist" (const $ status == Wishlist) `mappend`
    baseCtx
  where
    sources = [ path | (_, _, path) <- importSources imported ]
    targetedRecords = [ r | r <- importRecords imported, recordCategory r == category, recordStatus r == status ]
    showFilter = status == Done && any (isJust . recordRating) targetedRecords
    pageTitle = categoryLabel category

-- | Context for the main records index page.
doubanIndexCtx :: ImportResult -> Context String -> Context String
doubanIndexCtx imported baseCtx =
    constField "title" "Records" `mappend`
    constField "description" "A lightweight archive of books, films, music, and games imported from Douban." `mappend`
    constField "archiveDate" (extractArchiveDate sources) `mappend`
    listField "categories" categoryCtx (mapM makeItem [Book, Movie, Music, Game]) `mappend`
    baseCtx
  where
    sources = [ path | (_, _, path) <- importSources imported ]
    categoryCtx =
        field "name" (return . categoryLabel . itemBody) `mappend`
        field "slug" (return . categorySlug . itemBody) `mappend`
        field "description" (return . categoryDescription . itemBody) `mappend`
        field "doneCount" (\item -> return $ show $ length [ r | r <- importRecords imported, recordCategory r == itemBody item, recordStatus r == Done ]) `mappend`
        field "wishlistCount" (\item -> return $ show $ length [ r | r <- importRecords imported, recordCategory r == itemBody item, recordStatus r == Wishlist ]) `mappend`
        field "doneLabel" (return . doneLabel . itemBody) `mappend`
        field "doneUrl" (return . (\s -> "/records/" ++ s ++ ".html") . categorySlug . itemBody) `mappend`
        field "wishlistUrl" (return . (\s -> "/records/" ++ s ++ "/wishlist.html") . categorySlug . itemBody)

doneLabel :: Category -> String
doneLabel category = case category of
    Book  -> "Read"
    Movie -> "Watched"
    Music -> "Listened"
    Game  -> "Played"

renderStars :: Int -> String
renderStars n = replicate n '★' ++ replicate (5 - n) '☆'

extractArchiveDate :: [FilePath] -> String
extractArchiveDate paths =
    fromMaybe "unknown date" $ do
        path <- if null paths then Nothing else Just (head paths)
        let fileName = takeBaseName path
            digits = filter isNumber fileName
        if length digits >= 8
            then let rawDate = reverse $ take 8 $ reverse digits
                 in Just $ take 4 rawDate ++ "-" ++ take 2 (drop 4 rawDate) ++ "-" ++ drop 6 rawDate
            else Nothing
