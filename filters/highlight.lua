-- highlight.lua
-- Converts ==highlighted text== (Obsidian highlight syntax) to HTML <mark> tags

function Span(el)
    if el.classes[1] == "mark" then
        local content = pandoc.utils.stringify(el.content)
        return pandoc.RawInline('html', '<mark>' .. content .. '</mark>')
    end
end

function Str(el)
    local text = el.text
    local result = {}
    local last_end = 1

    for start_pos, content, end_pos in text:gmatch("()%=%=(.-)%=%=()") do
        if start_pos > last_end then
            table.insert(result, pandoc.Str(text:sub(last_end, start_pos - 1)))
        end
        table.insert(result, pandoc.RawInline('html', '<mark>' .. content .. '</mark>'))
        last_end = end_pos
    end

    if last_end <= #text then
        if #result > 0 then
            table.insert(result, pandoc.Str(text:sub(last_end)))
        else
            return el
        end
    end

    if #result > 0 then
        return result
    end
    return el
end