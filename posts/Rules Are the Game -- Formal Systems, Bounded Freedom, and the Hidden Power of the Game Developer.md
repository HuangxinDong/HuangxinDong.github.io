---
date: 2026-05-09
title: "Rules Are the Game: Formal Systems, Bounded Freedom, and the Hidden Power of the Game Developer"
tags:
  - video_game
  - logic
lang: en
---

## Preface: Video Games as Formal Systems
> Those few academics who have tried to define "game" have offered up everything from Roger Caillois' "activity which is...voluntary...uncertain, unproductive, governed by rules, make-believe" to Johan Huizinga's "free activity...outside 'ordinary' life..." to Jesper Juul's more contemporary and precise take: "A game is a rule-based formal system with a variable and quantifiable outcome, where different outcomes are assigned different values, the player exerts effort in order to influence the outcome, the player feels attached to the outcome, and the consequences of the activity are optional and negotiable."[^1]

This blog wants to discuss video games as formal systems, and how they grant players a freedom that is at the same time bounded.

But first, what is a _formal system_? A formal system is a closed structure composed of explicit symbols and rules: the symbols themselves carry no meaning; meaning comes from the relationships between symbols and from the rules that govern their operations. Mathematics, logic, and programming languages are all examples of formal systems. In this sense, games are formal systems too, as they have explicit elements (chess pieces, word tiles, characters), rules that govern how these elements interact, and boundaries between legal and illegal states. A formal system is closed and self-consistent; but what makes a game a game rather than mathematics is that semantics enter its formal structure: players bring goals, emotions, and interpretations into the system, layering meaning onto the syntax of the rules.

Freedom and rules form a classic antinomy: the rules of a game constrain what a player can do, yet they are also the precondition of the player's creativity; a developer designs a system, but the system produces behaviours that exceed the designer's intentions; a player experiences genuine freedom, yet that freedom unfolds within a carefully delimited space. These contradictions are not design problems to be solved — they are intrinsic to games as formal systems.

However, to make these contradictions precise, we first need to distinguish several concepts that are often used interchangeably.

## Rules, Mechanics, and Experience in Games

### Rules in Video Games

As we already know, in the practice of game development, developers define game behaviour by setting rules at different levels for different actions. For example, the following code defines an `_on_body_entered(body)` function for a coin, so that the player scores a point upon touching it:

```gdscript
func _on_body_entered(body):
    game_manager.add_point()
    print("+1 coin")
    queue_free()
```

Most basic game rules are quite intuitive and conventional: "touching a monster deals damage," "taking damage reduces health", while different games may have their own distinct settings, such as the stamina consumption during running and climbing in _The Legend of Zelda: Breath of the Wild_. Generally, good game design (as in most Nintendo games) tries not to require players to spend too long understanding the rules, instead embedding the rules into intuition, so that players can quickly find their footing, reach the next positive feedback loop, or freely explore the boundaries of the rules.

There are also harder-core games like [TIS-100](https://www.zachtronics.com/tis-100/) and [A=B](https://store.steampowered.com/app/1720850/AB/), where the rules may not be especially complex, but players may need to read through a manual before they can begin, and deepen their understanding of the rules as difficulty increases. Such games are undeniably off-putting at first, but there are always players who find greater satisfaction in them, because the complexity of the rules is itself part of the challenge.

### From Rules and Mechanics to Experience

In everyday discussions of games, "rules" and "mechanics" are often used interchangeably, but they refer to different things.

*Rules* are the content of a game's formal system: explicitly statable constraints in declarative form. `WALL IS STOP`, "bishops move diagonally", "health reaching zero means death"... these are all rules. Rules define which states in the system are legal and which transitions are permitted.

*Mechanics* are the realisation of rules at the level of experience: the units of action a player can actually perform, and the system responses these actions trigger. Pushing a box, moving a chess piece, jumping, building... these are mechanics. Mechanics are the interface through which players enter the formal system, translating abstract rules into concrete interactive behaviour. Players tend to discuss mechanics more than specific rules, because it is through interaction that different game experiences are produced.

If we treat experience as a system in its own right, then the *experience system* can be understood as the whole produced when a player interacts with rules through mechanics — encompassing the generation of strategy and emotion (frustration, epiphany), as well as all the expectations and interpretations the player brings into the game. If the formal system is closed and self-consistent, the experience system is semi-open: the player's subjectivity interacts with the rule system through mechanics, producing meanings that the rules themselves could not have anticipated.

The relationship between rules, mechanics, and experience is one of nesting: rules constitute the structure of the formal system, mechanics are the player's way of entering that structure, and the experience system is the whole that emerges when the two meet.

## *Baba Is You*: A Game Played by Changing Its Rules

[_Baba Is You_](https://www.hempuli.com/baba/) is a puzzle game made by Arvi Teikari. Like other sokoban-style games, the player controls a character on screen, pushing blocks to accomplish a task and then advancing to the next level. But _Baba Is You_ differs fundamentally from most sokoban games (and most puzzle games): its puzzles are not about "finding a solution within given rules," but about "creating a solution by changing the rules." In other words, it brings what is normally hidden in the game's underlying layer entirely to the surface, making rules themselves into game objects.

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/lIWCgholN_E?si=zY7s40sJalUPiC_e" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

The game's mechanics are quite simple. The map is scattered with word tiles (some already arranged, some loose): `BABA`, `IS`, `YOU`, `WALL`, `STOP`, `FLAG`, `WIN`... When combined, these tiles form the rules currently in effect: `BABA IS YOU` means the player controls Baba's movement; `FLAG IS WIN` means touching the flag wins the level; `WALL IS STOP` means walls cannot be traversed. Players can push these tiles and rearrange them, thereby rewriting the rules themselves. Some tiles are intentionally placed at the edges of the map to prevent them from being moved — though players can sometimes make limited changes by pushing `AND` to the end of a phrase.

In practice: you can push `WALL` in front of `IS WIN`, making walls the win condition; or make `WALL IS YOU`, turning yourself into a vast shifting mass of wall. If you dismantle `BABA IS YOU` — or any phrase containing `IS YOU` — you lose your object of control. This is not a conventional "failure": the player, having lost the rule that constitutes them as themselves, enters a strange state of subjectlessness. And of course, you can simultaneously maintain `BABA IS YOU` while forming `BABA IS WIN`, then walk toward yourself to complete the level. The design has a distinctive conceptual self-reflexivity: the game uses its own rules to discuss the nature of rules.

In more technical terms, the rule engine of _Baba Is You_ is structurally analogous to a formal system. Its grammar can be expressed roughly in BNF notation as follows:

```BNF
<rule> ::= <subject> <verb> <predicate>

<subject> ::= <noun>
		   | <noun> AND <noun>

<verb> ::= IS | HAS | MAKE

<predicate> ::= <noun>             -- IS，HAS，MAKE
             | <property>          -- IS
             | <noun> AND <noun>   -- IS，HAS
             | <property> AND <property>  -- IS

<noun> ::= BABA | WALL | FLAG | ROCK | WATER | LAVA
               | SKULL | KEY | DOOR | TEXT | LEVEL | ...

<property> ::= YOU | WIN | STOP | PUSH | SINK | DEFEAT
		    | HOT | MELT | OPEN | SHUT | FLOAT | MOVE
		    | SAFE | WEAK | DONE | ...
```

Word tiles are the symbol set; the legal combinations of tiles constitute the formation rules; the initial tile arrangement of each level is the axiom set; and when a player pushes tiles to rearrange them, they are effectively modifying the axiom set at runtime. But what makes this a game rather than a mathematical system is that its formal structure carries meaning that exceeds the rules: `WIN` signifies a state of value to the player; `YOU` signifies subjectivity and a sense of control. Each player's unique experience of the game arises at this point of contact.

Starting from _Baba Is You_ and games like it, we can discuss a slightly larger question: what exactly is a game's formal system, and what is the relationship between game rules and player freedom? And when we bring the developer into the picture, how should we understand this complicated relationship?

## Rules Are the Condition of Freedom

A common intuition, in life as in games, is that more rules mean less freedom. The rules of a game constrain what a player can do, and are therefore a restriction on freedom. But this intuition runs into immediate difficulty when confronted with actual gameplay experience. Chess has a set of strict rules: each piece's movement is precisely specified. Yet it is precisely this strictness that makes the strategic depth of a chess game possible. If pieces could move arbitrarily, chess would no longer be chess -- just pieces shuffled on a board, neither challenging nor creative.

This holds for many video games too. Take _Baba Is You_: the number of word tiles is finite, the logic of their combinations is finite, and the layouts of many levels are fixed. Yet it is precisely under these strict constraints that players are forced to break out of conventional thinking. So no longer searching for a path within the rules, but examining the structure of the rules themselves, looking for fissures and possibilities for recombination. Some solutions are not the paths the designer "reserved"; they are possibilities the player discovers within the combinatorial space of the rules, and sometimes possibilities the designer never anticipated.

This brings to mind Marx's description of the "species-being" (_Gattungswesen_) of humanity, in the _Economic and Philosophic Manuscripts of 1844_. Marx argued that human labour differs from animal instinct in that humans can "produce according to the standard of every species," applying an "inherent standard" to their objects. [^2] In other words, creative human labour is not merely adaptation to given conditions, it is the active opening-up of possibility. What game players do reflects exactly this kind of creative labour. In actual gameplay, the rules are not a cage; they are a set of "inherent standards," a language through which players think and create. Rules make the very concept of *creation* possible; without rules, there is no structure to be broken through, recombined, or exploited, and therefore no genuine player freedom.

*Constraint is the condition of freedom*, as a paradox,  has its technical counterpart in the domain of formal systems. Chomsky's theory of generative grammar holds that the creativity of human language derives from the capacity of finite rules to generate infinite sentences. [^3] Any native speaker can understand and produce sentences they have never heard before, precisely because language has a finite set of generative rules at its base.

To illustrate the same isomorphism in games: a finite set of rules can theoretically generate a near-infinite space of possible play. One of the clearest examples may be Go. My favourite example in video games is _Minecraft_, which offers players an explorable open world that generates progressively but within certain algorithmic constraints, as they move through it. Each new seed-generated world, or each step forward into unexplored territory in an existing world, can deliver a genuinely new experience.


## Patterns: The Product of Experience and Play

If rules are explicit and stated, then patterns are implicit and discovered. In actual gameplay, what players first encounter are rules and mechanics, but gradually they begin to identify the patterns beneath the rules: the implicit regularities and recognisable structures that emerge from the interaction of rules and mechanics. Good game design often builds a rhythm around this process: players identify a pattern, use it, and then encounter a moment that breaks it.

> [!sidenote] 
> Consider [Emoji Kitchen](https://emojikitchen.dev/), which uses a small number of simple patterns to produce a large variety of novel combinations. People may spend quite a bit of time combining emoji in interesting ways, but I doubt many will actually try every possible combination.

Crucially, ==patterns are finite, and they can be exhausted==. A formal system can theoretically generate near-infinite combinations of rules, but the meaning a player experiences does not scale linearly with the number of combinations. Given ten thousand combinations, if there are only three underlying patterns, a player will not genuinely find all ten thousand novel or interesting. Meaning is exhausted long before the possibility space is.

My own experience is that once I have identified the core patterns of a game, it becomes difficult to sustain interest in it — even when there is plenty of content left, or even when the developer continues to update. The games that get played repeatedly tend to be those designed to delay pattern exhaustion: large multiplayer online games maintain openness through the unpredictability of human opponents; _Animal Crossing_ and _Stardew Valley_ sustain engagement through temporal rhythms and emotional attachment; _Minecraft_ uses algorithmically generated open worlds to keep players facing probabilistic surprises, slowing the pace at which patterns become familiar; and classic _Minesweeper_, whose patterns and tricks are not hard to learn, but it keeps players returning through the timed challenge.

*Baba Is You* also takes an interesting approach to the problem of pattern exhaustion: it tried to make the patterns of one level rarely transfer directly to the next. Moreover, Arvi Teikari introduces new word tiles in each chapter, and not just adding content, but expanding the vocabulary of the formal system, adding elements that can generate new patterns.

However, no matter it is *Minecraft*'s random generation or *Baba Is You*'s chapter-by-chapter expansion, or other attempts from many different video games, their ultimately strategies are all for delaying pattern exhaustion, but cannot truly break the rule itself.

## Freedom, or "Designed Freedom"

When we bring the developer into view, the picture described above becomes considerably more complex.

> [!sidenote]
> Would players have more freedom if they could input their own vocabulary? _Scribblenauts_ offers an example: it allows users to type almost any word or phrase and summon corresponding objects. Yet all of these items are still pre-built into the game by the developers (surely in a highly efficient way!), and players can't summon anything outside the system's vocabulary.

When a player rewrites rules in _Baba Is You_, they often feel a strong sense of surprise — *Yayy I changed the way this world works!* But this "rewriting" takes place within a deeper framework of meta-rules. You can push the tiles because the rule `BABA IS YOU` allows you to push tiles; you can form `WALL IS WIN` because `WIN` is in the game's vocabulary and is moveable on the map. Players can never write a word outside the vocabulary, never invent a rule type that does not already exist in the system.

Furthermore, the layout of each level determines which tiles appear, where they appear, and whether they are within the player's reach. This means that in designing each level, the designer has already, to some degree, pre-set and repeatedly tested the "space of possible solutions." What feels like free exploration is exploration within a possibility space whose boundaries have been carefully drawn. Many game designers go further, deliberately designing the experience of "spontaneous discovery" as a reward mechanism. In _It Takes Two_, for instance, players can sometimes find a path off the main route, and following it may lead to a bonus level or an Easter egg. It is sometimes hard to say which outcome is more satisfying, or more deflating: discovering a path that leads to a small Easter egg, versus one that leads nowhere. The former is a genuine surprise, but the latter, in a certain sense, challenges the authority of the developer: this was probably not the experience they designed for you to have.

What this means is that designed freedom is not only structured, it is also bounded. The formal system may theoretically generate a vast number of combinations, but the number of ==patterns== a player can extract from them is finite. When patterns are exhausted, the "size" of the possibility space becomes irrelevant. What remains is the mechanical execution of rules, with no new meaning emerging. The real boundary of player freedom, then, is not the number of rules -- it is the number of patterns.

In Althusser's terms, the game's formal system "interpellates" the player [^4] — it summons them into a particular subject position ("you are a creator who can change the rules"), and that subject position is itself designed. The freedom and sense of creativity the player experiences from within it are genuine, but they are also pre-established by the system.

This is not to say that such experience is false. But the proposition is confirmed: **freedom is designed freedom, and this freedom has an inherent limit.** And this fact should change how we understand it.

## System Overflow: Bugs and Unintended Gameplay

*Emergence*, the intrinsic tendency of formal systems to produce behaviour at the system level that no single rule could independently predict, complicates the picture once again. When developing a game using object-oriented programming (OOP), the developer's thinking tends to be linear and modular: define a class, specify its properties and methods, then define the next class. Each rule is designed in isolation, under control. For example:

```gdscript
# Play animations
if is_on_floor():
    if direction == 0:
        animated_sprite_2d.play("idle")
    else:
        animated_sprite_2d.play("run")
else:
    animated_sprite_2d.play("jumping")
```

But when the game runs, all these rules take effect simultaneously, interacting with one another; meanwhile the player's behaviour is nonlinear and unpredictable. Situations arise that no single rule could have anticipated, requiring the developer to go back and revise. In this sense, a bug is not merely a code error: it is the moment at which the system's complexity exceeds the designer's anticipatory control — an overflow of the formal system itself.

This overflow does not only manifest as bugs. More interesting are the instances of "unintended gameplay" that players discover: players of _The Legend of Zelda: Tears of the Kingdom_ and _Minecraft_ regularly exploit the physics engine in ways the developers almost certainly never imagined, sometimes even discovering new patterns beyond those the developer pre-set; players of _Baba Is You_ may also find solutions to a level entirely outside what the designer envisioned.

This is what makes formal systems genuinely fascinating: they create a space of possibility larger than any single designer. The developer is a meta-legislator, but once the meta-law is enacted, it produces effects that exceed the legislator's intentions. The developer might believe they are designing a closed system, but the system's emergent capacity makes it an open field.

### Is Overflow Genuine Resistance?

Though this may look like entering a spiral of infinite scepticism: are the unintended plays players discover genuine resistance to the developer's authority, or are they also, in some sense, already designed?

In many games, especially open-world games, developers deliberately design the experience of "accidental discovery": what seems like a secret the player found themselves is in fact a carefully placed surprise (the Koroks in _The Legend of Zelda: Breath of the Wild_ are an example). The satisfaction players feel from discovery is real, but that satisfaction is itself manufactured. In another kind of case, some games incorporate players' "creative plays" into subsequent updates, formalising them as game mechanics, and thus what was once an overflow is absorbed back into the system. For example, ConcernedApe, upon discovering that _Stardew Valley_ players were using a glitch to obtain items, chose not to patch it, but instead added a playful in-game response.

Gramsci's concept of "hegemony" is relevant here: a dominant culture permits a degree of resistance precisely in order to secure deeper consent. [^5] When game developers allow or even celebrate the discovery of unintended gameplay, it may be more like a sophisticated design strategy: letting players feel a sense of agency, thereby drawing them deeper into the game.

But I don't think this analysis is a conclusion. It is a contradiction that needs to be held open. Even if the "accidental discovery" is designed, the cognitive process the player undergoes at the moment of finding it — the genuine reasoning and creativity performed within the combinatorial space of the rules — does not thereby become false. The authenticity of experience and the producedness of experience are not mutually exclusive.

This is also why _Baba Is You_'s system is quite interesting to me: it places the fact that "rules can be manipulated" plainly on the table. The player knows they are manipulating rules, and the designer knows the player knows. This transparency makes the game a good medium for thinking about formal systems themselves.

## Conclusion: The Formal System as a Dialectical Field

A game's formal system is a dialectical field. Player's freedom does not operated at a single level. Rules define the possibility space at the formal level; mechanics are the player's way of entering that space; patterns are the units of meaning the player extracts through interaction; and experience is the whole that emerges when the player's semantics meet the syntax of the formal system. This field contains several contradictions that cannot be simply resolved:

- Rules constrain freedom, yet are simultaneously its condition;
- Players create within the system, but their creation takes place within a possibility space that has been designed;
- Systems produce emergent behaviours that exceed the designer's intentions, but that emergence may itself be part of the design.

These contradictions are not problems to be solved, but intrinsic to games as formal systems. And this blog does not aim to provide an answer that resolves them, but to refuse satisfaction before the contradictions are resolved, just as dialectics does not resolve contradiction but moves toward it, bringing its nature into sharper relief.

When a player, after long preparation and battle, finally defeats the Ender Dragon and begins reading the End Poem; or finally solves a carefully defined puzzle and walks (as Baba, or as Wall) toward whichever object represents victory: do you feel only joy, or also a faint disorientation? As if the game had been waiting here all along for you to arrive at this so-called ending, whatever path you took to get there. As a player, was the goal you have been pursuing all this time something you genuinely wanted? Or something the designer/developer wanted you to want?

That disorientation, I think, is the most honest gift the formal system has to offer.

[^1]: Raph Koster, _Theory of Fun for Game Design_. (O'Reilly Media, 2013).

[^2]: Karl Marx, _Economic and Philosophic Manuscripts of 1844_, trans. Martin Milligan (Moscow: Progress Publishers, 1959).

[^3]: Noam Chomsky, _Syntactic Structures_ (The Hague: Mouton, 1957).

[^4]: Louis Althusser, "Ideology and Ideological State Apparatuses," in _Lenin and Philosophy and Other Essays_, trans. Ben Brewster (New York: Monthly Review Press, 1971).

[^5]: Antonio Gramsci, _Selections from the Prison Notebooks_, ed. and trans. Quintin Hoare and Geoffrey Nowell Smith (New York: International Publishers, 1971).