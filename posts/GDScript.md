---
title: GDScript Learning Notes
tags:
  - programming
  - gamedev
aliases:
  - Godot Scripts
created: 2024-05-22
modified: 2024-11-29
description: Godot GDScript 学习笔记，包含基础语法、常见用法与参考链接。
lang: zh
---

>[!note]
>本篇笔记整理自 Brackeys 的 YouTube 视频教程笔记和 Godot Engine (4.x) 简体中文文档

- GDScript Tutorial：[How to program in Godot - GDScript Tutorial - YouTube](https://www.youtube.com/watch?v=e1zJS31tr88)
- GDScript Tutorial with 中文字幕：[Brackeys- How to program in Godobilibili](https://www.bilibili.com/video/BV1mH4y1g7e5/?spm_id_from=333.337.search-card.all.click&vd_source=694e5a50a3811065576bcab7d65154ab)
- Docs
	- [ 学习用 GDScript 编程 — Godot Engine (4.x) 简体中文文档 ](https://docs.godotengine.org/zh-cn/4.x/getting_started/introduction/learn_to_code_with_gdscript.html#learn-in-your-browser-with-the-gdscript-app)
	- [GDScript 参考 — Godot Engine (4.x) 简体中文文档 ](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/gdscript_basics.html)
- Others:
	- [[Godot]]
	- [Godot 4 Recipes](https://kidscancode.org/godot_recipes/4.x/)

---

# Syntax
### Modifying nodes

`$` is short for `get_node()`
```gdscript
@export var my_node: Sprite2D
@onready var weapon = $Player/Weapon

func _ready(): # called by engine
	$Label.text = "Hello, world!"
```

### Input

[ 输入示例 — Godot Engine (4.x) 简体中文文档 ](https://docs.godotengine.org/zh-cn/4.x/tutorials/inputs/input_examples.html)
```gdscript
func _input()
	if event.is_action_pressed("my_action"):
		jump()
```

### Variables

```gdscript
var health = 100 # dynamic typing
var health: int = 100 # static typing, this variable wiil always stay an integer
var health := 100 # inferred typing

@export var health := 100 # allow us to set it using the inspector

const GRAVITY = -9.81 # use CONSTANT_CASE

func _ready():
	heatlth += 10
	heatlth -= 10
	heatlth *= 10
	heatlth /= 10
	print("Health: "+ str(health))
```

注意 scope（作用域）

### If statements

```gdscript
if x != y or y >= z:
	pass
elif y != z:
	pass
else:
	print("haha")
```

### Data types

- `bool`
- `int`
- `float`
- `string`
- `Vector2`: stores two floats, x and y
- `Vector3`:  stores three floats, x y z

```gdscript
var position = Vector3(1,2,3)
position.x += 2
```

### Functions

```gdscript
func add(num1: int, num2: int) -> int:
	var result = num1 + num2
	return result
```

### Random numbers

[ 随机数生成 ](https://docs.godotengine.org/zh-cn/4.x/tutorials/math/random_number_generation.html)

- `randf()` gives a random number between 0 and 1
- `randf_range(from, to)`: gives a random floating-point number number between from and to
- `rand_irange(int1, int2)`: gives a random integer number between int1 and int2

You can also set a fixed random seed instead using `seed()`

### shuffle bag

我们希望随机挑选水果. 然而, 每次选择水果时依靠随机数生成会导致分布不那么 _均匀_ . 如果玩家足够幸运（或不幸）, 他们可能会连续三次或更多次得到相同的水果.

你可以使用 _shuffle bag_ 模式来实现。它的工作原理是在选择数组后从数组中删除一个元素。多次选择之后，数组会被清空。当这种情况发生时，就将数组重新初始化为默认值。
```gdscript
var _fruits = ["apple", "orange", "pear", "banana"]

# A copy of the fruits array so we can restore the original value into `fruits`.

var _fruits_full = []


func _ready():
	randomize()
	_fruits_full = _fruits.duplicate() # deep copy
	_fruits.shuffle()

	for i in 100:
		print(get_fruit())


func get_fruit():
	if _fruits.is_empty():

		# Fill the fruits array again and shuffle it.

		_fruits = _fruits_full.duplicate()
		_fruits.shuffle()

	# Get a random fruit, since we shuffled the array,
	# and remove it from the `_fruits` array.

	var random_fruit = _fruits.pop_front()

	# Prints "apple", "orange", "pear", or "banana" every time the code runs.

	return random_fruit
```

### Arrays

```gdscript
var array = []
var items: Array[String] = ["Knife", "Potion"]
items.append("Sword")
items[1] = "Damaged Knife"
```

### Loops

```gdscript

# for loop

for item in items:
	print(item)

# while loop

while true: # DO NOT CREATE INFINIT LOOP!
	learn()
```

### Dictionaries

key value pairs
```gdscript
var my_dict = {}
var employees = {
	"Jim": {"Salary":85, "Gender": "Male"},
	"Pam": {"Salary":80, "Gender": "Female"},,
}
players["Dwight"] = {"Salary":87, "Gender": "Male"}
print(employees["Jim"])

for employee in employees:
	print(employee + "'s salary:" + str(employees[employee]["Salary"] ))
```

### Enums

枚举的成员是常量，所以大写
```gdscript
enum Suits { HEART,CLUB,DIAMOND,SPADE }
var card1 = Suit.CLUB
@export var card_suit: Suits

func _ready():
	if card1 == Suit.CLUB
		print("Club A")
```

最好将枚举的每个项写在单独的一行
```gdscript
enum Element {
	EARTH,
	WATER,
	AIR,
	FIRE,
}
```

### Match statements

[GDScript-match](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/gdscript_basics.html#match)
```gdscript
func _ready():
	match Suits:
		Suits.HEART:
			print("Heart")
		Suits.CLUB:
			print("Club")
		_:
			print("Which suit is this card?")
```

### Signals

最好用过去时态来命名信号。

```gdscript
func _on_button_pressed():
	pass
```

```gdscript
signal leveled_up(msg)

var xp := 0
for i in 8:
	xp += 5
	if xp >= 20:
		leveled_up.emit("DING!")

func _ready():
	leveled_up.connect(_on_leveled_up) # connect without inspector
	leveled_up.disconnect(_on_leveled_up)
	
func _on_leveled_up(msg):
	print(msg)
```

### Setter and getter

[GDScript-setter and getter](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/gdscript_basics.html#properties-setters-and-getters)
set(value) 是变量的 **setter** 方法，用来控制变量被赋值时的行为。
```gdscript
var health := 100
	set(value):
		health = clamp(value, 0, 100)
```

其中 `clamp(value, 0, 100)` 将传入的 value 限制在 0 到 100 的范围内。

类似于 set 方法，get 方法用来控制变量在被读取时的行为，更常用于转换值：
```gdscript
var chance := 100
var chance_pct: int:
	get:
		return chance * 100
	set(value):
		chance = float(value)/100
```

>[!Attention]
>Unlike `setget` in previous Godot versions, `set` and `get` methods are **always** called (except as noted below), even when accessed inside the same class (with or without prefixing with `self.`). This makes the behavior consistent. If you need direct access to the value, use another variable for direct access and make the property code use that name.

### Classes

https://www.bilibili.com/video/BV1mH4y1g7e5?t=3072.9
Godot 所有内置节点都是类
```gdscript
class_name Charactor

extends Node
```

### Inner classes

```gdscript
var chest := Equipment.new()
var legs := Equipment.new()

func _ready():
	chest.armor = 20

# Inner class

class Equipment:
	var armor := 10
	var weight := 5
```

### Composition

bitlytic
How you can easily make your code simpler in Godot 4

## Practices
### Call down, signal up

[Node communication](https://kidscancode.org/godot_recipes/4.x/basics/node_communication/)
在层次结构中，节点可以调用位于其下方的节点上的函数，但反之则不然。

### Memory management

[GDScript-memory-management](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/gdscript_basics.html#memory-management)

### Style

[GDScript 编写风格指南 ](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/gdscript_styleguide.html#)

代码顺序：
```gdscript

01. @tool
02. class_name
03. extends
04. # docstring

05. signals
06. enums
07. constants
08. @export variables
09. public variables
10. private variables
11. @onready variables

12. optional built-in virtual _init method
13. optional built-in virtual _enter_tree() method
14. built-in virtual _ready method
15. remaining built-in virtual methods
16. public methods
17. private methods
18. subclasses

```
