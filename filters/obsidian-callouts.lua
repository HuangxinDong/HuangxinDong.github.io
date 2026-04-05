-- Converts Obsidian callout blockquotes to HTML that mirrors Obsidian's
-- structure more closely, including aliases and foldable callouts.

local aliases = {
    summary = "abstract",
    tldr = "abstract",
    hint = "tip",
    important = "tip",
    check = "success",
    done = "success",
    help = "question",
    faq = "question",
    caution = "warning",
    attention = "warning",
    fail = "failure",
    missing = "failure",
    error = "danger",
    cite = "quote",
}

local supported = {
    note = true,
    abstract = true,
    info = true,
    todo = true,
    tip = true,
    success = true,
    question = true,
    warning = true,
    failure = true,
    danger = true,
    bug = true,
    example = true,
    quote = true,
}

local icons = {
    note = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>]],
    abstract = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-clipboard-list"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 12h6"></path><path d="M9 16h4"></path></svg>]],
    info = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>]],
    todo = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-circle-check-big"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>]],
    tip = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-lightbulb"><path d="M15 14c.2-.6.5-1.2.9-1.7a6 6 0 1 0-7.8 0c.4.5.7 1.1.9 1.7"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>]],
    success = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>]],
    question = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-circle-help"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>]],
    warning = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>]],
    failure = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>]],
    danger = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9-11A1 1 0 0 1 14 3v7h6a1 1 0 0 1 .78 1.63l-9 11A1 1 0 0 1 10 21v-7z"></path></svg>]],
    bug = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bug"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"></path><path d="M12 20c-3.31 0-6-2.69-6-6V9h12v5c0 3.31-2.69 6-6 6"></path><path d="M5 9H3"></path><path d="M21 9h-2"></path><path d="M5 13H2"></path><path d="M22 13h-3"></path><path d="M5 17H3"></path><path d="M21 17h-2"></path></svg>]],
    example = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path></svg>]],
    quote = [[<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-quote"><path d="M16 3h5v5"></path><path d="M4 13h5v8H4z"></path><path d="M15 13h5v8h-5z"></path><path d="M9 13a4 4 0 0 1 4-4V3a10 10 0 0 0-10 10"></path><path d="M20 13a4 4 0 0 1 4-4V3A10 10 0 0 0 14 13"></path></svg>]],
}

local function trim(text)
    return (text:gsub("^%s+", ""):gsub("%s+$", ""))
end

local function title_case(identifier)
    local words = {}

    for part in identifier:gmatch("[^%-_]+") do
        table.insert(words, part:sub(1, 1):upper() .. part:sub(2):lower())
    end

    return table.concat(words, " ")
end

local function render_blocks_html(blocks)
    local doc = pandoc.Pandoc(blocks)
    local walked = doc:walk({ BlockQuote = BlockQuote })
    return pandoc.write(walked, "html")
end

local function render_inlines_html(inlines)
    if #inlines == 0 then
        return ""
    end

    local html = pandoc.write(pandoc.Pandoc({ pandoc.Plain(inlines) }), "html")
    return trim(html)
end

local function collect_body_blocks(block_quote, first_block, content_start_idx)
    local body_blocks = pandoc.List({})
    local remaining_inlines = pandoc.List({})

    for i = content_start_idx, #first_block.content do
        remaining_inlines:insert(first_block.content[i])
    end

    if #remaining_inlines > 0 then
        body_blocks:insert(pandoc.Para(remaining_inlines))
    end

    for i = 2, #block_quote.content do
        body_blocks:insert(block_quote.content[i])
    end

    return body_blocks
end

function BlockQuote(el)
    if #el.content == 0 then
        return el
    end

    local first_block = el.content[1]
    if first_block.t ~= "Para" or #first_block.content == 0 then
        return el
    end

    local first_elem = first_block.content[1]
    if not first_elem or first_elem.t ~= "Str" then
        return el
    end

    local raw_type, fold_state = first_elem.text:match("^%[!([^%]]+)%]([%+%-]?)$")
    if not raw_type then
        return el
    end

    local raw_type_lower = raw_type:lower()
    local canonical_type = aliases[raw_type_lower] or raw_type_lower

    if canonical_type == "sidenote" or canonical_type == "sidenote-l" then
        local body_blocks = collect_body_blocks(el, first_block, 2)
        local content_html = render_blocks_html(body_blocks)
        local sidenote_class = canonical_type == "sidenote-l" and "sidenote sidenote-left" or "sidenote sidenote-right"
        return pandoc.RawBlock("html", string.format('<span class="%s">%s</span>', sidenote_class, content_html))
    end

    local title_parts = pandoc.List({})
    local content_start_idx = 2

    for i = 2, #first_block.content do
        local elem = first_block.content[i]
        if elem.t == "SoftBreak" or elem.t == "LineBreak" then
            content_start_idx = i + 1
            break
        end

        title_parts:insert(elem)
        content_start_idx = i + 1
    end

    local body_blocks = collect_body_blocks(el, first_block, content_start_idx)
    local body_html = render_blocks_html(body_blocks)
    local style_type = supported[canonical_type] and canonical_type or "note"

    local title_html = render_inlines_html(title_parts)
    if title_html == "" then
        title_html = title_case(raw_type_lower)
    end

    local icon_markup = string.format(
        '<div class="callout-icon" aria-hidden="true">%s</div>',
        icons[style_type] or icons.note
    )

    local title_markup = string.format(
        '%s<div class="callout-title-inner">%s</div>',
        icon_markup,
        title_html
    )

    local content_markup = ""
    if trim(body_html) ~= "" then
        content_markup = string.format('\n<div class="callout-content">\n%s\n</div>', body_html)
    end

    local attributes = string.format(
        'class="callout callout-%s" data-callout="%s"',
        style_type,
        raw_type_lower
    )

    if fold_state ~= "" then
        attributes = attributes .. string.format(' data-callout-fold="%s"', fold_state)
        local open_attr = fold_state == "+" and " open" or ""

        return pandoc.RawBlock(
            "html",
            string.format(
                '<details %s%s>\n<summary class="callout-title">%s<div class="callout-fold" aria-hidden="true"></div></summary>%s\n</details>',
                attributes,
                open_attr,
                title_markup,
                content_markup
            )
        )
    end

    return pandoc.RawBlock(
        "html",
        string.format(
            '<div %s>\n<div class="callout-title">%s</div>%s\n</div>',
            attributes,
            title_markup,
            content_markup
        )
    )
end
