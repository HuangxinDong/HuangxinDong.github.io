-- obsidian-callouts.lua
-- Converts Obsidian callout blocks to styled HTML divs.
--
-- Supported callout types (maps to CSS class .callout-<type>):
--   note, info, tip, warning, caution, danger, error, important,
--   abstract, summary, question, quote, example, success, check,
--   done, fail, bug

function BlockQuote(el)
    if #el.content == 0 then return el end

    local first_block = el.content[1]
    if first_block.t ~= "Para" then return el end

    local first_elem = first_block.content[1]
    if not first_elem or first_elem.t ~= "Str" then return el end

    -- Match [!type] or [!type]+ or [!type]-
    local ctype = first_elem.text:match("^%[!([^%]]+)%][-+]?$")
    if not ctype then return el end

    local ctype_lower = ctype:lower()
    local title = ctype:sub(1,1):upper() .. ctype:sub(2):lower()  -- Title-case default

    -- Collect any additional title text after [!type] up to the first line break
    local content_start_idx = 2
    local title_parts = {}
    for i = 2, #first_block.content do
        local elem = first_block.content[i]
        if elem.t == "SoftBreak" or elem.t == "LineBreak" then
            content_start_idx = i + 1
            break
        else
            table.insert(title_parts, elem)
            content_start_idx = i + 1
        end
    end

    if #title_parts > 0 then
        local title_str = pandoc.utils.stringify(title_parts):gsub("^%s+", "")
        if title_str ~= "" then
            title = title_str
        end
    end

    -- Collect body content: rest of first Para + remaining blocks
    local content_inlines = {}
    for i = content_start_idx, #first_block.content do
        table.insert(content_inlines, first_block.content[i])
    end

    local new_blocks = {}
    if #content_inlines > 0 then
        table.insert(new_blocks, pandoc.Para(content_inlines))
    end
    for i = 2, #el.content do
        table.insert(new_blocks, el.content[i])
    end

    -- Render body to HTML
    local content_doc  = pandoc.Pandoc(new_blocks)
    local content_html = pandoc.write(content_doc, 'html')

    local html = string.format(
        '<div class="callout callout-%s">\n<div class="callout-title">%s</div>\n%s</div>',
        ctype_lower, title, content_html
    )

    return pandoc.RawBlock('html', html)
end