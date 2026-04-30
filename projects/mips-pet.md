---
date: 2025-12-20
title: MIPS32 Digital Pet Simulator
description: A simple digital pet simulator written in MIPS32 Assembly Language. It features energy management, leveling, sickness, dating, and a save/load system.
image: /assets/images/mips-pet.png
source: https://github.com/HuangxinDong/mips32-digital-pet
tags:
  - assembly
---

Useful links for learning MIPS assembly language: 

- [MIPS Quick Tutorial](https://minnie.tuhs.org/CompArch/Resources/mips_quick_tutorial.html)
- [rohitdwivedula/mips-exercises](https://github.com/rohitdwivedula/mips-exercises)

The COMP0068 module covered the full stack from floating-point representations to transistors, but one of its most memorable components was the group coursework: build a digital pet simulator in MIPS assembly, then extend it with features of your own choosing.

MIPS32 Digital Pet Simulator is our group project for COMP0068 Computer Architecture, and also my first MIPS Assembly Language project. It simulates a virtual pet that requires care, attention, and energy management.


## What we started with

Before starting the MIPS version, I first wrote a Python prototype to simulate the basic game loop, including command cycling, status display, and energy depletion. This prototype was completed in under 30 minutes because it only required considering functionality without worrying about register allocation and stack maintenance.

Using the Python version as a reference, I created the MIPS32 skeleton of a basic loop: the pet starts with some energy, commands increase or decrease it, and a natural depletion rate ticks it down over time. We needed configurable parameters (EDR, MEL, IEL), a live status display, and at least a handful of commands.

Our first task was decomposition. Assembly has no objects, no modules, no namespaces — just labels and jumps. We treated each logical unit as a labelled procedure and enforced a consistent calling convention across the whole file: `$s` registers are callee-saved, always push `$ra` before calling anything, always match `addi $sp, $sp, -N` with `addi $sp, $sp, N` on exit. 

> [!sidenote]
> We learned this the *hard* way. One of the earliest commits in the repository is simply titled "fixing return address bug." Getting that convention internalised early was probably the most important thing we did in the setup phase.

Without this discipline, the moment two procedures call each other the return address gets overwritten and the program vanishes.

## Real-time depletion

The coursework brief states that the pet's energy should depletes "over time." This seems to mean that the program should run in real time. However, MARS simulator runs in a event loop, and does not support real-time execution. We explored several approaches to achieve this: polling the clock in a tight loop, which would block input entirely; using a background timer, but MARS offers no threading primitives; and finally, do nothing during input, then measure how much time had passed the moment the player submits a command. It trades live mid-wait display for correctness and simplicity, and in practice it's barely noticeable.

MIPS (via [MARS](https://computerscience.missouristate.edu/mars-mips-simulator.htm)) exposes system time through `syscall 30`, which returns the current time in milliseconds. Our final approach was to store the timestamp at the start of each command, then at the next command check how many full seconds had elapsed:

```mips
li   $v0, 30
syscall
move $t1, $a0         # current time (ms)

lw   $t2, last_tick
sub  $t3, $t1, $t2    # elapsed ms

li   $t4, 1000
div  $t3, $t4
mflo $t7              # seconds passed
```

Each elapsed second triggers one tick of depletion. Crucially, we only advance `last_tick` by the accounted milliseconds (`num_ticks × 1000`), not all the way to now — so the leftover milliseconds carry forward into the next loop iteration. This keeps timing accurate regardless of how long the player takes to enter a command.

We also came up with a "Sleep mode" feature, which offered an interesting case: if the pet is asleep, we reset `last_tick` to now rather than accumulating ticks. Otherwise, waking a sleeping pet would immediately deduct however many seconds it had been asleep, punishing the player for the feature working correctly. This feature turns out to be quite useful for testing purposes, because everyone gets tired and bored easily if they always have to input commands every few seconds to keep their pet alive.

## The save system

The save/load feature was our main extension. My original plan was more ambitious: write state to a file, check for its existence on startup, and resume the game automatically if the player agreed. But a persistent bug in the file I/O path made that approach unworkable, and I eventually accepted that the save-code method was more robust given MARS's constraints. It felt inelegant at the time, but after finishing the project, I discovered that many older games used exactly the same mechanism. What started as a workaround turned out to be an accidental tribute to a whole era of game design.

> [!sidenote]
> In hindsight, I really should have waited until the very end to implement this feature...

To implement the save code feature, I encountered a wide range of problems: First, I had to consider how many bits to reserve to store all the information and how to encode and slightly obfuscate the stored information to prevent users from guessing an arbitrary number (in the initial version, entering 0 could also yield a save code, so I had to limit the number of digits entered). Furthermore, I needed to validate the read save code to ensure that no buffer overflow or other exceptions occurred during reading. Moreover, with the addition of features, especially the level system, I constantly had to modify the encoding method of the stored information, increasing the number of bits to store more information.

Eventually, I encoded the game state into four 32-bit integers, each holding several packed values via bitwise operations:

```mips
# Code 1: EDR (8 bits) | MEL (8 bits) | IEL (8 bits) | Energy (8 bits)
lw $t0, EDR
sll $t0, $t0, 8
lw $t1, MEL
or $t0, $t0, $t1
sll $t0, $t0, 8
# ... and so on
xori $t0, $t0, 0x12345678   # XOR obfuscation
```

The XOR pass isn't real encryption, but it means the codes look opaque and resist naive tampering. On load, we decrypt with the same key and validate every field: MEL must be positive, IEL ≤ MEL, energy ≤ MEL, level ≥ 1. An invalid code falls through to a new game rather than silently corrupting state.

Implementing this taught me something that sounds obvious but isn't until you feel it: in assembly, *you* are the type system. There's no integer overflow protection, no bounds checking on array access, no compiler warning when you read the wrong bits. Every constraint you want has to be explicitly coded, tested, and re-tested.

## Unexpected difficulty: `str_to_int`

MARS's `read_string` syscall gives you a buffer. Turning that buffer into an integer means walking character by character, checking ASCII bounds (48–57 for `'0'`–`'9'`), accumulating the value, and handling edge cases: empty input, leading minus signs, non-digit characters, trailing newlines, and input that exceeds a reasonable limit.

At first, our `str_to_int` function did not handle inputs that were not valid ASCII characters. This led to a problem where if the player enters a non-integer number, the program would crash.

We solved this problem by turning the boot sequence into a small, defensive input pipeline. Instead of assuming the player would always enter a valid number, the program now reads the startup prompt into a buffer, checks whether the user wants to restore a saved session, and only then falls back to the fresh-game setup. From there, each parameter is validated through a reusable config reader, and the IEL value is checked against MEL before the game starts. That change made the startup flow much more robust: invalid or missing input no longer breaks the program, and the user gets a clear fallback path instead.

Here are some examples from main.asm:

```mips
# Ask to load session
li $v0, 4
la $a0, msg_ask_load
syscall

# Read input (Y/N)
li $v0, 8
la $a0, input_buffer
li $a1, 12
syscall

lb $t0, input_buffer
li $t1, 'Y'
beq $t0, $t1, try_load
```

And for parameter validation:

```mips
# Get EDR config
la $a1, EDR
la $a0, msg_edr_prompt
li $t9, 1
li $t8, 100
jal read_config

# Check IEL <= MEL
lw $t0, IEL
lw $t1, MEL
ble $t0, $t1, iel_ok
```

The upper-bound problem was subtler than it looked. A teammate found it by trying entering `9999999999`, which wrapped around into nonsense energy values. That became an issue and then a fix: every numeric input now has an explicit cap, checked after parsing. Our final `str_to_int` returns `$v0 = -1` on any invalid input and `$v1` pointing to the terminator character (so the caller can parse the next token from the same buffer for multi-part save codes). Writing a parser in a language with no string type clarifies exactly what parsing *is*.

## What came out of it

We ended up with more features than the spec required: a levelling system with a scaling threshold (`5 + level × 2` positive actions to level up), random sickness events with a cure command, a dating command that unlocks at level 2 with randomised outcomes, and a game analytics report on exit. The group received full marks.

More than the grade, though, the project gave me a concrete mental model for things I had read about but not fully believed: that the stack is just a region of memory and `$sp` is just a register we agree to treat carefully; that a "function call" is just `jal` and `jr $ra` with some conventions around it; that floating-point and integer representations are just different agreements about what the same bits mean.

Assembly felt alienating at first in a way that Python or C never had — closer to reading a circuit diagram than writing a program. By the end, it felt less like a different kind of programming and more like the same thing with fewer abstractions in the way. Which is, I think, the point.

Feel free to check out the [source code](/assets/files/mips-pet.asm.txt) if you're interested.