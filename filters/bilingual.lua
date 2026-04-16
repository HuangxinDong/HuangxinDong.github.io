-- filters/bilingual.lua
-- This filter converts fenced divs with classes 'zh' or 'en'
-- to HTML divs with classes 'lang-zh' or 'lang-en'.

function Div(el)
  if el.classes:includes('zh') then
    el.classes:insert('lang-zh')
    -- Remove the short 'zh' class to keep DOM clean if desired, 
    -- but keeping it is fine too.
    return el
  elseif el.classes:includes('en') then
    el.classes:insert('lang-en')
    return el
  end
end
