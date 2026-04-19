{-# LANGUAGE OverloadedStrings #-}
module Site.Pandoc.Callouts
    ( transformObsidianCallouts
    ) where

import           Data.Char             (isAlphaNum, toLower)
import           Data.List             (intercalate)
import qualified Data.Text             as T
import           Text.Pandoc.Definition
import           Text.Pandoc.Walk      (walk)

transformObsidianCallouts :: Pandoc -> Pandoc
transformObsidianCallouts = walk rewriteBlockQuote

rewriteBlockQuote :: Block -> Block
rewriteBlockQuote block@(BlockQuote blocks) =
    case parseCallout blocks of
        Just spec -> renderCallout spec
        Nothing   -> block
rewriteBlockQuote block = block

data CalloutSpec = CalloutSpec
    { calloutType    :: String
    , calloutTitle   :: [Inline]
    , calloutBody    :: [Block]
    , calloutVariant :: CalloutVariant
    }

data CalloutVariant
    = StandardCallout
    | SideNote
    | SideNoteLeft

parseCallout :: [Block] -> Maybe CalloutSpec
parseCallout [] = Nothing
parseCallout (firstBlock:restBlocks) =
    case firstBlock of
        Para inlines  -> parseFromFirstBlock inlines
        Plain inlines -> parseFromFirstBlock inlines
        _             -> Nothing
  where
    parseFromFirstBlock [] = Nothing
    parseFromFirstBlock (Str marker : remaining)
        | Just rawType <- parseMarker (T.unpack marker)
        , Just variant <- classifyType rawType =
            let (titleInlines, remainingInlines) = break isBreakInline remaining
                inlineBody = dropWhile isBreakInline remainingInlines
                bodyBlocks = assembleBodyBlocks inlineBody restBlocks
            in Just CalloutSpec
                { calloutType = rawType
                , calloutTitle =
                    if null titleInlines
                        then [Str (T.pack (defaultTitle rawType))]
                        else titleInlines
                , calloutBody = bodyBlocks
                , calloutVariant = variant
                }
        | otherwise = Nothing
    parseFromFirstBlock _ = Nothing

assembleBodyBlocks :: [Inline] -> [Block] -> [Block]
assembleBodyBlocks [] blocks = blocks
assembleBodyBlocks inlines blocks = Para inlines : blocks

parseMarker :: String -> Maybe String
parseMarker marker =
    case marker of
        '[' : '!' : rest ->
            case reverse rest of
                ']' : reversedType
                    | not (null reversedType) ->
                        let rawType = map toLower (reverse reversedType)
                        in if all isCalloutTypeChar rawType then Just rawType else Nothing
                _ -> Nothing
        _ -> Nothing

isCalloutTypeChar :: Char -> Bool
isCalloutTypeChar c = isAlphaNum c || c == '-'

classifyType :: String -> Maybe CalloutVariant
classifyType rawType
    | rawType `elem` supportedCalloutTypes = Just StandardCallout
    | rawType == "sidenote"                = Just SideNote
    | rawType == "sidenote-l"              = Just SideNoteLeft
    | otherwise                            = Nothing

supportedCalloutTypes :: [String]
supportedCalloutTypes =
    [ "note"
    , "abstract"
    , "info"
    , "todo"
    , "tip"
    , "success"
    , "question"
    , "warning"
    , "failure"
    , "danger"
    , "bug"
    , "example"
    , "quote"
    ]

renderCallout :: CalloutSpec -> Block
renderCallout spec =
    case calloutVariant spec of
        StandardCallout ->
            Div
                ("", map T.pack ["callout", "callout-" ++ calloutType spec], [("data-callout", T.pack (calloutType spec))])
                [ Div
                    ("", ["callout-title"], [])
                    [ Plain
                        [ Span
                            ("", ["callout-icon"], [("aria-hidden", "true"), ("data-icon", T.pack (iconFor (calloutType spec)))])
                            []
                        , Span ("", ["callout-title-inner"], []) (calloutTitle spec)
                        ]
                    ]
                , Div ("", ["callout-content"], []) (calloutBody spec)
                ]
        SideNote ->
            Div ("", ["sidenote"], []) (calloutBody spec)
        SideNoteLeft ->
            Div ("", ["sidenote", "sidenote-left"], []) (calloutBody spec)

iconFor :: String -> String
iconFor calloutTypeName = case calloutTypeName of
    "note"     -> "i"
    "abstract" -> "="
    "info"     -> "i"
    "todo"     -> "+"
    "tip"      -> "*"
    "success"  -> "+"
    "question" -> "?"
    "warning"  -> "!"
    "failure"  -> "x"
    "danger"   -> "!"
    "bug"      -> "!"
    "example"  -> ">"
    "quote"    -> "\""
    _          -> "i"

defaultTitle :: String -> String
defaultTitle = intercalate " " . map capitalize . splitOnHyphen
  where
    capitalize []     = []
    capitalize (x:xs) = toLower x `seq` (toUpperAscii x : map toLower xs)

toUpperAscii :: Char -> Char
toUpperAscii c
    | 'a' <= c && c <= 'z' = toEnum (fromEnum c - 32)
    | otherwise            = c

splitOnHyphen :: String -> [String]
splitOnHyphen [] = [""]
splitOnHyphen (c:cs)
    | c == '-' = "" : splitOnHyphen cs
    | otherwise =
        case splitOnHyphen cs of
            []           -> [[c]]
            (part:parts) -> (c : part) : parts

isBreakInline :: Inline -> Bool
isBreakInline SoftBreak = True
isBreakInline LineBreak = True
isBreakInline _         = False
