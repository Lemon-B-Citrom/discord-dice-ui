import {
  CriticalDamageType,
  CriticalFamily,
  CriticalLocation,
  CriticalLocationGroup,
  CriticalTable,
  CriticalTableRow,
} from "./criticalTypes";

const rowLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];
const locationTableNames: { [location in CriticalLocation]: string } = {
  head: "Head",
  body: "Body",
  arm: "Arm",
  leg: "Leg",
  motiveSystem: "Motive Systems",
  hull: "Hull",
  weapon: "Weapon",
  turret: "Turret",
};

function createTable(
  family: CriticalFamily,
  location: CriticalLocation,
  page: string,
  texts: ReadonlyArray<string>,
  damageType?: CriticalDamageType,
  prerequisites: { [rowSeverity: number]: number } = {}
): CriticalTable {
  if (texts.length !== 10) {
    throw new Error("Critical table must contain ten severity rows");
  }

  const tableName =
    family === "humanoid"
      ? `${damageType} / ${locationTableNames[location]}`
      : locationTableNames[location];
  const rows: CriticalTableRow[] = texts.map((text, index) => ({
    severity: (index + 1) as CriticalTableRow["severity"],
    rowLabel: rowLabels[index],
    text,
    source: `${page}, ${tableName}, row ${rowLabels[index]}`,
    ...(prerequisites[index + 1]
      ? {
          prerequisiteSeverity: prerequisites[
            index + 1
          ] as CriticalTableRow["severity"],
        }
      : {}),
  }));

  return { family, location, ...(damageType ? { damageType } : {}), rows };
}

export const HUMANOID_CRITICAL_TABLES: ReadonlyArray<CriticalTable> = [
  createTable(
    "humanoid",
    "arm",
    "crit tables.pdf p. 849",
    [
      "The attack grazes the target’s arm, causing it to spasm uncontrollably with pain. All tests involving that arm suffer a −30 penalty for 1d5 rounds.",
      "The attack smashes into the arm, sending currents of energy crackling down to the fingers and up to the shoulder. The target suffers 1 level of Fatigue, and that arm is Useless for 1d5 rounds.",
      "The arm suffers superficial burns inflicting no small amount of pain on the target. The target suffers 1d5 levels of Fatigue, and can take only a Half Action during his next turn.",
      "The shock of the attack causes the character to temporarily lose control of his autonomous functions. He is Stunned for 1 round and is knocked Prone. The arm is Useless for 1d10 rounds.",
      "The attack causes energy to course through the target’s arm. He is Stunned for 1 round, and the arm is Useless until the target receives medical treatment.",
      "The attack wreathes the arm in flame, scorching clothing and armour, and temporarily fusing together the target’s fingers. The target suffers 1d5 levels of Fatigue and 1d5 Weapon Skill and Ballistic Skill damage, and he must make a Challenging (+0) Fortitude Test or suffer the Lost Hand condition.",
      "With a terrible snapping sound, the heat of the attack boils the marrow in the target’s arm, causing it to crack or even shatter. The target suffers 1d5 levels of Fatigue and is Stunned for 1 round. His arm is Useless until it is repaired.",
      "Energy ripples across the target’s arm, causing skin and muscle to slough disgustingly from the target’s limb, revealing a sticky red mess of sinew and bone. The target suffers 1d10 levels of Fatigue and must make a Challenging (+0) Fortitude Test or be Stunned for 1d5 rounds. He now suffers from the Lost Arm condition.",
      "Fire consumes the target’s arm, burning the flesh to a crisp right down to the bone. The target must make an immediate Challenging (+0) Fortitude Test or die from shock. If he survives, the target suffers 1d10 levels of Fatigue and is Stunned for 1 round. The target now suffers from the Lost Arm condition.",
      "The attack reduces the arm to a cloud of crimson ash and sends the target crumbling to the ground. He immediately dies from shock, clutching his smoking stump.",
    ],
    "Energy"
  ),
  createTable(
    "humanoid",
    "body",
    "crit tables.pdf p. 849",
    [
      "A blow to the target’s body steals the air from his lungs. The target can take only a Half Action on his next turn.",
      "The blast punches the air from the target’s body. He must make a Challenging (+0) Fortitude Test or be knocked Prone.",
      "The attack cooks the flesh on the chest and abdomen. He suffers 2 levels of Fatigue and 1d5 Toughness damage.",
      "The energy ripples all over the character, scorching his body with horrid third-degree burns. The target suffers 1d10 levels of Fatigue, and can only take a Half Action on his next turn.",
      "The fury of the attack forces the target to the ground, helplessly covering his face and keening in agony. The target is knocked Prone and must make a Challenging (+0) Dodge Test or catch fire. The target must also make a Challenging (+0) Fortitude Test or be Stunned for 1 round.",
      "Struck by the full force of the attack, the target is sent reeling to the ground; smoke spiraling out from the wound. The target suffers 1d5 levels of Fatigue, is knocked Prone, and is Stunned for 1d10 rounds. In addition, he must make a Challenging (+0) Dodge Test or catch fire.",
      "The intense power of the energy attack cooks the target’s organs, burning his lungs and heart with intense heat. The target is Stunned for 2d10 rounds, and his Toughness characteristic is permanently reduced by 1d10.",
      "As the attack washes over the target, his skin turns black and peels off, while melted fat seeps from his clothing and armour. The target is Stunned for 2d10 rounds. His Strength, Toughness, and Agility characteristics are reduced by half (rounding up) until he receives medical treatment. Permanently reduce the character’s Fellowship characteristic by 2d5.",
      "The target is completely encased in fire, melting his skin and bursting his eyes like superheated eggs. He falls to the ground a lifeless corpse, blackened and charred with horrid burns.",
      "As above, but if the target is carrying any ammunition, roll 1d10: on a result of 6 or higher, it explodes. Each target within 1d5 metres suffers a single hit for 1d10+5 Explosive damage to a randomly determined Hit Location. If the target carried any grenades or missiles, these detonate on the character’s corpse with their normal effects one round after his demise.",
    ],
    "Energy",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "head",
    "crit tables.pdf p. 850",
    [
      "A grazing blow to the head disorientates the target. He suffers a −10 penalty to all tests (except Fortitude Tests) for 1 round.",
      "The blast of energy dazzles the target. He is Blinded for 1 round.",
      "The attack cooks off the target’s ear, leaving him with a partially burned stump of cartilage. He is Deafened for 1d5 hours (or until he receives medical attention).",
      "The energy attack burns away all of the hairs on the target’s head, as well as leaving him reeling from the injury. The target suffers 2 levels of Fatigue and the target is Blinded for 1d5 rounds.",
      "A blast of energy envelops the target’s head, burning his face and hair, crisping his skin, and causing him to scream like a stuck grox. In addition to losing all hair on his scalp and face, he is Blinded for 1d10 rounds and Stunned for 1 round. Permanently reduce the target’s Fellowship characteristic by 1.",
      "The attack cooks the target’s face, melting his features and damaging his eyes. The target suffers 1d5 levels of Fatigue and is Blinded for 1d10 hours. Permanently reduce his Fellowship and Perception characteristics by 1d5.",
      "In a gruesome display, the flesh is burned from the target’s head, exposing charred bone and muscle underneath. The target suffers 1d10 levels of Fatigue. He is Blinded permanently. Roll 1d10; this is the target’s new Fellowship characteristic value. If his Fellowship value is already 10 or lower, this can be skipped as no one would notice any difference in his behaviour and demeanour.",
      "The target’s head is destroyed in a conflagration of fiery death. He does not survive.",
      "Superheated by the attack, the target’s brain explodes, tearing apart his skull and sending flaming chunks of meat flying at those nearby. The target is very, very dead.",
      "As above, except the target’s entire body catches fire and runs off headless 2d10 metres in a random direction. Anything flammable it passes, including characters, must make a Challenging (+0) Dodge Test or catch fire.",
    ],
    "Energy",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "leg",
    "crit tables.pdf p. 850",
    [
      "The blast of energy sears the flesh and bone of the target’s leg, leaving a nasty burn scar. The target cannot use the Run or Charge actions for 2 rounds.",
      "The attack flash-fries the target’s leg, cooking chunks of flesh into char. The target must pass a Challenging (+0) Fortitude Test or suffer 1 level of Fatigue.",
      "A solid blow to the leg sends currents of agony coursing through the target. The target suffers 1 level of Fatigue and is knocked Prone. Reduce his Movement by half (rounding up) for 1d10 rounds.",
      "The blast causes a nasty compound fracture in the target’s leg. Until the target receives medical attention, reduce his Movement by half (rounding up), and he cannot use the Run or Charge actions.",
      "The target’s leg endures horrific burn damage, fusing clothing and armour with flesh and bone. The target suffers 1 level of Fatigue and is knocked Prone. Reduce his Movement by half (rounding up) for 2d10 rounds.",
      "The attack burns the target’s foot, charring the flesh and emitting a foul aroma. The target suffers 2 levels of Fatigue. He must also make a Challenging (+0) Fortitude Test. If he succeeds, reduce his Movement by half (rounding up) until he receives medical attention; if he fails, he suffers the Lost Foot condition.",
      "The energy attack fries the leg, leaving it a mess of blackened flesh. The leg is broken and until repaired, the target counts as having lost the leg. He suffers 1d5 levels of Fatigue. He must also make a Challenging (+0) Fortitude Test or be Stunned for 1 round. He now suffers the Lost Leg condition.",
      "Energy sears through the bone, causing the leg to be severed. The target suffers 1d10 levels of Fatigue and suffers Blood Loss. He must also make a Challenging (+0) Fortitude Test or be Stunned for 1 round. He now suffers the Lost Leg condition.",
      "The force of the attack reduces the leg to little more than a chunk of sizzling gristle. The target must make a Challenging (+0) Fortitude Test or die from shock. He now suffers the Lost Leg condition.",
      "In a terrifying display of power, the leg immolates and thick fire consumes the target completely. He dies in a matter of agonising seconds, his scorched corpse surrounded with smoke and flames.",
    ],
    "Energy"
  ),
  createTable(
    "humanoid",
    "arm",
    "crit tables.pdf p. 851",
    [
      "The attack throws the limb backwards, painfully jerking it away from the body. The target suffers 1 level of Fatigue.",
      "The force of the blast snaps the bones of the arm in half. The target drops anything held in that hand and must pass a Challenging (+0) Fortitude Test or be Stunned for 1 round.",
      "The explosion removes 1 finger (and the tips from up to 1d5 others) from the target’s hand. The target suffers 1d10 Weapon Skill and 1d10 Ballistic Skill damage, and anything he was carrying in that hand is destroyed. If this is an explosive such as a grenade, it detonates; immediately resolve the 9 effect on this table upon the target.",
      "The blast rips the sinew of the arm straight from the bone. The target is Stunned for 1 round and must make a Challenging (+0) Fortitude Test or suffer Blood Loss. The limb is Useless until the target receives medical attention.",
      "Fragments from the explosion tear into the target’s hand, ripping away flesh and muscle alike. He must immediately make an Ordinary (+10) Fortitude Test. If he succeeds, permanently reduce his Weapon Skill and Ballistic Skill characteristics by 1; if he fails, he suffers the Lost Hand condition.",
      "The explosive attack shatters the bone and mangles the flesh, turning the target’s arm into a red ruin. The target suffers Blood Loss and 1d5 levels of Fatigue. The arm is Useless until he receives medical attention.",
      "In a violent hail of flesh, the arm is blown apart. The target must immediately make a Challenging (+0) Fortitude Test or die from shock. If he survives, he suffers 1d10 levels of Fatigue, is Stunned for 1d10 rounds, and suffers Blood Loss. The target now suffers from the Lost Arm condition.",
      "The arm disintegrates under the force of the explosion, taking a good portion of the shoulder and chest with it. The target is sent screaming to the ground, where he dies in a pool of his own blood and organs.",
      "With a mighty bang the arm is blasted from the target’s body, killing the target instantly in a rain of blood droplets. In addition, if the target was carrying a weapon with a power source in his hand (such as a power sword or chainsword), then it violently explodes, inflicting a single hit for 1d10+5 Impact damage to a randomly determined Hit Location upon each target within two metres.",
      "As above, except if the target is carrying any ammunition it explodes, inflicting a single hit for 1d10+5 Impact damage to a randomly determined Hit Location upon each target within 1d10 metres (in addition to the hit noted above). If the target is carrying any grenades or missiles, these also detonate immediately with their normal effects.",
    ],
    "Explosive",
    { 3: 9, 10: 9 }
  ),
  createTable(
    "humanoid",
    "body",
    "crit tables.pdf p. 851",
    [
      "The explosion flings the target backwards 1d5 metres. The target is knocked Prone.",
      "The target is blown backwards 1d5 metres by a terrific explosion, suffering 1 level of Fatigue per metre travelled. The target is knocked Prone.",
      "The force of the blast sends the target sprawling to the ground. The target is knocked backwards 1d5 metres, Stunned for 1 round, and is knocked Prone.",
      "The power of the explosion rends flesh and bone with horrific results. The target must make a Challenging (+0) Fortitude Test or suffer from Blood Loss and be Stunned for 1 round.",
      "Concussion from the explosion knocks the target to the ground and turns his innards into so much ground meat. The target suffers 1d5 levels of Fatigue and is knocked Prone. He must immediately make a Challenging (+0) Fortitude Test; if he fails, he suffers Blood Loss and his Toughness characteristic is permanently reduced by 1.",
      "Chunks of the target’s flesh are ripped free by the force of the attack leaving large, weeping wounds. The target is Stunned for 1 round and suffers Blood Loss.",
      "The explosive force of the attack ruptures the target’s flesh and scrambles his nervous system, knocking him to the ground. The target is Stunned for 1d10 rounds and is knocked Prone. He also suffers Blood Loss, and must make a Challenging (+0) Fortitude Test or fall Unconscious.",
      "The target’s chest explodes outward, disgorging a river of partially cooked organs onto the ground, killing him instantly.",
      "Pieces of the target’s body fly in all directions as he is torn into bloody gobbets. If the target is carrying any ammunition, it explodes, inflicting a single hit for 1d10+5 Impact damage to a randomly determined Hit Location upon each target within 1d10 metres. If the target is carrying any grenades or missiles, these detonate immediately.",
      "As above, except anyone within 1d10 metres of the target is drenched in gore. Each affected character must make a Challenging (+0) Agility Test or suffer a −10 penalty to Weapon Skill and Ballistic Skill tests for 1 round, as blood fouls his sight.",
    ],
    "Explosive",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "head",
    "crit tables.pdf p. 852",
    [
      "The explosion leaves the target confused. He can take only a Half Action on his next turn as he recovers his senses.",
      "The flash and noise leaves the target Blinded and Deafened for 1 round.",
      "The detonation leaves the target’s face a bloody ruin from scores of cuts. Permanent scarring is very likely. The target suffers 2 levels of Fatigue and must make a Challenging (+0) Fortitude Test or suffer 1d10 points of Perception and Fellowship damage.",
      "The force of the blast knocks the target to the ground and leaves him senseless. The target suffers 1d10 Intelligence damage and is knocked Prone. He must also pass a Challenging (+0) Fortitude Test; if he fails, he is Stunned for 2 rounds and his Intelligence characteristic is permanently reduced by 1.",
      "The explosion flays the flesh from the target’s face and bursts his eardrums with its force. The target is Stunned for 1d10 rounds and is permanently Deafened. Permanently reduce his Fellowship characteristic by 1d5.",
      "The target’s head explodes under the force of the attack, leaving his headless corpse to spurt blood from the neck for the next few minutes. Needless to say, this is instantly and messily fatal.",
      "Both head and body are blown into a mangled mess, instantly killing the target. If he is carrying any ammunition, it explodes, inflicting a single hit for 1d10+5 Impact damage to a randomly determined Hit Location on each target within 1d5 metres. If the target was carrying any grenades or missiles, these also detonate immediately with their normal effects.",
      "In a series of unpleasant explosions the target’s head and torso peel apart, leaving a gory mess on the ground. For the rest of the fight, anyone moving over this spot must make a Challenging (+0) Agility Test or fall Prone.",
      "The target ceases to exist in any tangible way, entirely turning into a kind of bright red mist that spreads through the surrounding area. He cannot get much deader than this, except...",
      "As above, except such is the unspeakably appalling manner in which the target was killed that each of the target’s allies within two metres of where the target stood must make an immediate Challenging (+0) Discipline Test. If an ally fails the test, he must spend his next turn fleeing from the attacker.",
    ],
    "Explosive",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "leg",
    "crit tables.pdf p. 852",
    [
      "A glancing blast sends the character backwards one metre. The target must make a Challenging (+0) Fortitude Test or be knocked Prone.",
      "The force of the explosion takes the target’s feet out from under him. He is knocked Prone and cannot use any Movement action except for the Half Move action for 1d5 rounds.",
      "The concussion causes the target’s leg to fracture. The target suffers 2d10 Agility damage.",
      "The explosion sends the target spinning through the air. He is flung 1d5 metres away in a random direction. It takes the target a Full Action to regain his feet, and his Movement is reduced by half (rounding up) for 1d10 rounds.",
      "Explosive force removes part of the target’s foot and scatters the ragged remnants over a wide area. The target must make a Difficult (−10) Fortitude Test or suffer 1d5 levels of Fatigue. Permanently reduce his Agility characteristic by 1d5.",
      "The concussive force of the blast shatters the target’s leg bones and splits apart flesh. The target suffers 1d10 levels of Fatigue. The leg is Useless until he receives medical attention. The target must make a Challenging (+0) Fortitude Test; if he fails, he suffers the Lost Foot condition.",
      "The explosion reduces the target’s leg into a hunk of smoking meat. The target must immediately make a Challenging (+0) Fortitude Test or die from shock. If he survives, he suffers 1d10 levels of Fatigue, is Stunned for 1d10 rounds, and suffers Blood Loss. He now suffers the Lost Leg condition.",
      "The blast tears the leg from the body in a geyser of gore, sending him crashing to the ground, blood pumping from the ragged stump. This grievous wound is instantly fatal.",
      "The leg explodes in an eruption of blood, killing the target immediately and sending tiny fragments of bone, clothing, and armour hurtling off in all directions. Each target within 2 metres suffers a single hit for 1d10+2 Impact damage to a randomly determined Hit Location.",
      "As above, but if the target is carrying any ammunition it detonates, inflicting a single hit for 1d10+5 Impact damage to a randomly determined Hit Location upon each target within 1d10 metres (in addition to the hit noted above). If the target is carrying any grenades or missiles, these detonate immediately with their normal effects.",
    ],
    "Explosive",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "arm",
    "crit tables.pdf p. 853",
    [
      "The attack strikes the target’s limb with a powerful blow. He drops anything he was holding in that hand.",
      "The strike leaves a deep bruise, possibly causing minor fractures in the arm. The target suffers 1 level of Fatigue.",
      "The impact smashes into the arm or whatever the target is holding, ripping it away and leaving the target reeling from the pain. He is Stunned for 1 round and drops anything he was holding in that hand. Roll 1d10; on a result of 1, anything the target was holding in that hand is badly damaged and unusable until repaired.",
      "The impact crushes flesh and bone. The target drops anything he was holding in that hand, and must make a Challenging (+0) Fortitude Test or suffer 1d10 Weapon Skill and 1d10 Ballistic Skill damage.",
      "Muscle and bone take a pounding as the attack rips into the arm. The limb is Useless until the target receives medical attention.",
      "The attack pulverises the target’s hand, crushing and breaking 1d5 fingers. The target suffers 1 level of Fatigue. He must make a Challenging (+0) Fortitude Test; if he fails, permanently reduce his Weapon Skill and Ballistic Skill characteristics by 2.",
      "With a loud snap, the arm bone is shattered and left hanging limply at the target’s side, dribbling blood onto the ground. The target suffers Blood Loss. The arm is Useless until the target receives medical attention.",
      "The force of the attack takes the arm off just below the shoulder, showering blood and gore across the ground. The target must immediately make a Challenging (+0) Fortitude Test or die from shock. If he survives, he suffers 1d5 levels of Fatigue, is Stunned for 1d10 rounds, and suffers Blood Loss. He also now suffers from the Lost Arm condition.",
      "In a rain of blood, gore, and meat, the target’s arm is removed from his body. Screaming incoherently, he twists about in agony for a few seconds before collapsing to the ground and dying.",
      "As per the effect directly above, except as the arm is removed by the force of the attack, bone, chunks of flesh, clothing, and armour fragments fly about like blood-soaked shrapnel. Each target within 2 metres suffers a single hit for 1d5−3 Impact damage to a randomly determined Hit Location.",
    ],
    "Impact",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "body",
    "crit tables.pdf p. 853",
    [
      "A blow to the target’s body steals the breath from his lungs. The target can take only a Half Action on his next turn.",
      "The impact punches the air from the target’s body. He suffers 1 level of Fatigue and is knocked Prone.",
      "The attack breaks a rib with a resounding crunch. The target is Stunned for 1 round and knocked Prone.",
      "The blow batters the target, shattering a rib. The target suffers 1d10 Toughness damage and must make a Challenging (+0) Agility Test or be knocked Prone.",
      "A solid blow to the chest pulverises the target’s innards, and he momentarily doubles over in pain, clutching himself and crying in agony. The target is Stunned for 2 rounds and must make a Challenging (+0) Fortitude Test or suffer 1d5 levels of Fatigue.",
      "The attack knocks the target sprawling on the ground. The target suffers 1d5 levels of Fatigue, is flung 1d5 metres away from the attacker (stopping if he hits a solid object), and falls Prone. He is Stunned for 2 rounds.",
      "With an audible crack, 1d5 of the target’s ribs break. Permanently reduce the target’s Toughness characteristic by 1d5. Until he receives medical attention, at the end of each round in which this character took an action, roll 1d10. On a result of 1 or 2, the character dies instantly as a shattered rib pierces a vital organ.",
      "The force of the attack ruptures several of the target’s organs and knocks him down, gasping in wretched pain. The target suffers Blood Loss. Permanently reduce his Toughness characteristic by 1d10.",
      "The target jerks back from the force of the attack, throwing back his head and spewing out a jet of blood before crumpling to the ground dead.",
      "As per the effect directly above, except the target’s lifeless form is thrown 1d10 metres directly away from the attack. Any target in the corpse’s path must make a Challenging (+0) Agility Test or be knocked Prone.",
    ],
    "Impact",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "head",
    "crit tables.pdf p. 854",
    [
      "The impact fills the target’s head with a terrible ringing noise. The target must make a Challenging (+0) Fortitude Test or suffer 1 level of Fatigue.",
      "The hit causes the target’s sight to blur and his head to spin. The target suffers a −10 penalty to Perception and Intelligence tests for 1d5 rounds.",
      "The target’s nose breaks in a torrent of blood, blinding him for 1 round. The target must make a Challenging (+0) Fortitude Test or be Stunned for 1 round.",
      "The concussive strike staggers the target. The target must make a Challenging (+0) Fortitude Test or be Stunned for 1 round and knocked Prone.",
      "The force of the blow sends the target reeling in pain. The target suffers 1 level of Fatigue, is Stunned for 1 round, and staggers backwards 1d5 metres. Permanently reduce his Intelligence characteristic by 1.",
      "The target’s head is snapped back by the attack, leaving him staggering around trying to control mind-numbing pain. The target is Stunned for 1d5 rounds, is knocked backwards 1d5 metres, and must make a Challenging (+0) Agility Test or be knocked Prone.",
      "The attack slams into the target’s head, fracturing his skull and opening a long tear in his scalp. The target is Stunned for 1d10 rounds. His Movement is halved (rounding up) for 1d10 hours.",
      "With a sickening crunch, the target’s head snaps around to face the opposite direction. The twisted vertebrae immediately sever every connection within the target’s neck, and his death is instantaneous.",
      "The target’s head bursts like an overripe fruit and sprays blood, bone, and brains in all directions. Each target within 4 metres of the deceased must make a Challenging (+0) Agility Test or suffer a −10 penalty to his Weapon Skill and Ballistic Skill tests on his next turn, as gore gets in his eyes or obscures his visor.",
      "As above, except that the attack was so powerful that it passes through the target and strikes another target nearby. If the hit was from a melee weapon, the attacker may immediately make another attack (with the same weapon) against any other target he can reach without moving. If the hit was from a ranged weapon, he may immediately make another attack (with the same weapon) against any target standing directly behind the original target and within range of his weapon.",
    ],
    "Impact",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "leg",
    "crit tables.pdf p. 854",
    [
      "A blow to the leg results in deep bruises and teeth-clenching pain. The target suffers 1 level of Fatigue.",
      "A grazing strike against the leg slows the target. The target’s Movement is reduced by half (rounding up) for 1 round. He must make a Challenging (+0) Fortitude Test or be Stunned for 1 round and fall Prone.",
      "A solid blow to the leg sends lightning agony coursing through the target. He is knocked Prone and suffers 1d10 Agility damage.",
      "A powerful impact causes micro-fractures in the target’s bones, inflicting considerable agony. The target is knocked Prone and suffers 2d10 Agility damage.",
      "The blow breaks the target’s leg with an agonising snap. He is Stunned for 1 round and knocked Prone. Reduce his Movement to 1 metre until he receives medical attention.",
      "With a sharp cracking noise, several of the tiny bones in the target’s foot snap like twigs. The target suffers 2 levels of Fatigue, and his Movement is halved (rounded up) until he receives medical attention. He must make a Challenging (+0) Fortitude Test or suffer the Lost Foot condition.",
      "With a nasty crunch, the leg is broken and the target is left mewling in pain. He is Stunned for 2 rounds and falls Prone. The leg is Useless until the target receives medical attention.",
      "The force of the attack rips the lower half of the leg away in a stream of blood. The target must immediately make a Challenging (+0) Fortitude Test or die from shock. If he survives, he suffers Blood Loss and suffers the Lost Leg condition. Permanently reduce his Agility Characteristic by 1d5.",
      "The hit rips apart the flesh of the leg, causing blood to spray out in all directions. Even as the target tries futilely to stop the sudden flood of vital fluid, he falls to the ground and dies in a spreading pool of gore.",
      "As above, but such is the agony of the target’s death that his terrible screams drown out all conversation within 2d10 metres for the rest of the round.",
    ],
    "Impact",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "arm",
    "crit tables.pdf p. 855",
    [
      "The slashing attack tears free whatever the target was carrying. He drops anything he was holding in that hand.",
      "Deep cuts cause the target to drop his arm. He suffers 1 level of Fatigue and releases anything he was holding in that hand.",
      "The attack shreds the target’s arm into ribbons, causing the target to scream in pain. He drops anything he was holding in that hand, and must make a successful Challenging (+0) Fortitude Test or suffer Blood Loss.",
      "The attack flays the skin from the limb, filling the air with blood and the sounds of his screaming. The target suffers 2 levels of Fatigue and falls Prone. The arm is Useless for 1d10 rounds.",
      "A bloody and very painful-looking furrow is opened up in the target’s arm. He suffers Blood Loss and drops anything he was holding in that hand. The arm is Useless until the target receives medical attention.",
      "The blow mangles flesh and muscle as it hacks into the target’s hand, liberating 1d5 fingers in the process (a roll of a 5 means that the thumb has been sheared off as well). The target is Stunned for 1 round and must immediately make a Challenging (+0) Fortitude Test or suffers the Lost Hand condition.",
      "The attack rips apart skin, muscle, bone, and sinew with ease, turning the target’s arm into a dangling ruin of severed veins and spurting blood. He suffers Blood Loss and 1d10 Strength damage. The arm is Useless until the target receives medical attention.",
      "With an assortment of unnatural, wet, ripping sounds, the arm flies free of the body trailing blood behind it in a crimson arc. The target must immediately make a Challenging (+0) Fortitude Test or die from shock. If he survives, he is Stunned for 1d10 rounds and suffers Blood Loss. He suffers from the Lost Arm condition.",
      "The attack slices clean through the arm and into the torso, drenching the ground in blood and gore. The target is killed instantly, leaving a ruined corpse on the ground.",
      "As above, but as the arm falls to the ground its fingers spasm uncontrollably, pulling the trigger of any held weapon. If the target was carrying a ranged weapon, roll 1d100. On a result of 96 or higher, a single randomly determined target within 2d10 metres is struck by a single hit from that weapon on a randomly determined Hit Location.",
    ],
    "Rending",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "body",
    "crit tables.pdf p. 855",
    [
      "If the target is not wearing armour on this location, he suffers 1 level of Fatigue from a painful laceration. If he is wearing armour, there is no effect, and he thanks the Emperor for his foresight.",
      "A powerful slash opens a painful rent in the target’s body. He suffers 1 level of Fatigue and must make a Challenging (+0) Fortitude Test or be Stunned for 1 round.",
      "The attack rips a large patch of skin from the target’s torso, leaving him gasping in pain. The target is Stunned for 1 round and must make a Challenging (+0) Fortitude Test or suffer Blood Loss.",
      "The blow opens up a long wound in the target’s torso, causing him to double over in terrible pain. The target is Stunned for 1 round and suffers Blood Loss.",
      "A torrent of blood spills from the deep cuts, making the ground slick with gore. The target suffers Blood Loss and suffers 1d10 Toughness damage. Any character attempting to move through this pool of blood must make a Challenging (+0) Agility Test or fall Prone.",
      "The mighty attack takes a sizeable chunk out of the target and knocks him to the ground as he clutches the oozing wound, shrieking in pain. The target is knocked Prone, suffers Blood Loss, and suffers 1d10 Toughness damage.",
      "The attack cuts open the target’s abdomen, threatening to expose his entrails. The target suffers Blood Loss. Permanently reduce his Toughness characteristic by 1d5. Until he receives medical attention, at the end of each round, if he took any actions (besides holding his guts in and waiting for a medic), roll 1d10. On a result of 1 or 2, he suffers an additional 2d10 Rending damage.",
      "With a vile tearing noise, the skin on the target’s chest comes away revealing a red ruin of muscle. He must succeed on a Challenging (+0) Fortitude Test or perish. If he survives, he is Stunned for 1 round and suffers Blood Loss. Permanently reduce his Toughness characteristic by 1d10.",
      "The powerful blow cleaves the target from gullet to groin, revealing his internal organs and spilling them on to the ground before him. The target is now quite dead.",
      "As above, except that the area and the target are awash with slippery gore. For the rest of the fight, any character who moves within four metres of the target’s corpse must make a Challenging (+0) Agility Test or fall Prone.",
    ],
    "Rending",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "head",
    "crit tables.pdf p. 856",
    [
      "The attack tears a painful rent in the target’s face. If he is wearing a helmet, he suffers no ill effects; otherwise, he suffers 1 level of Fatigue.",
      "The attack slices open the target’s scalp, which immediately begins to bleed profusely, spilling into his eyes. The target suffers a −10 penalty to Weapon Skill and Ballistic Skill tests for the next 1d10 rounds. He must pass a Challenging (+0) Fortitude Test or suffer Blood Loss.",
      "The attack rips open the target’s face with a vicious shredding sound. He is Stunned for 1 round and suffers Blood Loss. If he is wearing a helmet, it is torn off.",
      "The attack slices across one of the target’s eye sockets, possibly scooping out the eye. The target suffers 1d10 Perception damage. He must make a Routine (+20) Fortitude test if he fails, he suffers the Lost Eye condition.",
      "The attack tears the target’s helmet from his head. If he is not wearing a helmet, the target instead loses an ear and is Deafened until he receives medical attention. If he loses an ear, he must also pass a Challenging (+0) Fortitude Test or have his Fellowship characteristic permanently reduced by 1. The target is Stunned for 1d5 rounds.",
      "The blow rips violently across the target’s face, taking with it an important feature. The target suffers 1d5 levels of Fatigue and suffers Blood Loss. Roll 1d10 to see what the target has lost. 1–3: Eye (see the Lost Eye condition), 4–7: Nose (permanently reduce his Fellowship characteristic by 1d10), 8–10: Ear (the target is Deafened until he receives medical attention).",
      "In a splatter of skin and teeth, the attack removes most of the target’s face. The strike might not have slain him, but the target’s words are forever slurred as a result of this vicious injury. The target is Stunned for 1 round and suffers Blood Loss. He is permanently Blinded. Permanently reduce his Fellowship characteristic by 1d10.",
      "The blow slices into the side of the target’s head causing his eyes to pop out and his brain to ooze down his cheek like spilled jelly. He is dead before he hits the ground.",
      "With a sound not unlike a wet sponge being torn in half, the target’s head flies free of its body and sails through the air, landing harmlessly 2d10 metres away with a soggy thud. The target is instantly slain.",
      "As above, except the target’s neck spews blood in a torrent, drenching all those within 1d5 metres and forcing each effected target to make a Challenging (+0) Agility Test. Each character who fails the Test suffers a −10 penalty to Weapon Skill and Ballistic Skill tests for 1 round, as gore fills his eyes or fouls his visor.",
    ],
    "Rending",
    { 10: 9 }
  ),
  createTable(
    "humanoid",
    "leg",
    "crit tables.pdf p. 856",
    [
      "The attack knocks the limb backwards, painfully twisting it awkwardly. The target suffers 1 level of Fatigue.",
      "The target’s kneecap splits open. He must make a Challenging (+0) Agility Test or fall Prone and suffer Blood Loss as the injured extremity hits the ground.",
      "The attack rips a length of flesh from the leg. The target suffers Blood Loss and suffers 1d5 Agility damage.",
      "The attack rips the kneecap free from the target’s leg, and he collapses to the ground. The target is knocked Prone and suffers 1d10 Agility Damage. His Movement values are halved (rounding up) until he receives medical attention.",
      "In a spray of blood, the target’s leg is deeply slashed, exposing bone, sinew, and muscle. The target suffers Blood Loss. He must make a Challenging (+0) Fortitude Test; if he fails, permanently reduce his Agility characteristic by 1.",
      "The blow slices a couple of centimetres off the end of the target’s foot. The target suffers Blood Loss. He must make a Challenging (+0) Fortitude Test. If he succeeds, his Movement is halved (rounding up) until he receives medical attention. If he fails, he suffers the Lost Foot condition.",
      "The force of the blow cuts deep into the leg, grinding against bone and tearing ligaments apart. The target is Stunned for 1 round, is knocked Prone, and suffers Blood Loss. The leg is Useless until the target receives medical attention.",
      "In a single bloody hack the target’s leg is lopped off, spurting its vital fluids across the ground. The target must immediately make a Challenging (+0) Fortitude Test or die from shock. If he survives, he is Stunned for 1d10 rounds and suffers Blood Loss. He suffers the Lost Leg condition.",
      "With a meaty chop, the leg comes away at the hip. The target pitches to the ground howling in agony before dying.",
      "As above, except that the tide of blood is so intense that, for the remainder of the encounter, any character who makes a Run or Charge action within 6 metres of the corpse must make a Challenging (+0) Agility Test or be knocked Prone.",
    ],
    "Rending",
    { 10: 9 }
  ),
];

export const VEHICLE_CRITICAL_TABLES: ReadonlyArray<CriticalTable> = [
  createTable(
    "vehicle",
    "hull",
    "veh crit tables.pdf PDF p. 1",
    [
      "The vehicle jolts to one side with the force of a strong hit, forcing all aboard to grab onto something to stay in their seats. Any crewmember who is not strapped in or otherwise secured must make an Ordinary (+10) Fortitude Test or be Stunned for 1 round.",
      "An internal gas line bursts, unleashing an opaque but non-lethal cloud within the crew compartment. Until the leak is sealed, the crew suffers a −20 penalty on all tests to take actions in the vehicle. Anyone inside the vehicle can spend a Full Action on his turn to close the leak without a test.",
      "A jarring blow tosses the vehicle around, throwing things about the interior. Any crewmember who is not strapped in or otherwise secured must make an Ordinary (+10) Fortitude Test or be Stunned for 1d5 rounds. Anyone aboard the vehicle suffers a −10 penalty to ranged attacks until the end of the next round.",
      "Some electrical cabling or power coupling is blasted loose by the impact, raining a sudden shower of sparks down on a member of the crew. A randomly selected member of the crew suffers 1 level of Fatigue and a single hit for 1d10+6 Impact damage to the Body location.",
      "Several hull plates buckle and fall away, weakening the vehicle. Reduce the Armour points of the facing struck by the attack by 1d10 until the vehicle is repaired.",
      "A small explosion rips through the crew compartment, damaging internal systems and wounding the crew. Each character in the affected section of the vehicle (as determined by the GM) suffers 1 level of Fatigue, suffers a single hit for 1d10+6 Explosive damage to the Body location, and must make a Challenging (+0) Dodge Test or catch fire (see Section 9.3 “Conditions, Special Damage, & Damage States”). If this occurs, refer to the On Fire! section below.",
      "The hit tears through the vehicle’s armour, leaving only useless shards of metal. Reduce the Armour points of the facing struck by the attack by half (rounding up) until the vehicle is repaired. If the hit came from a ranged attack, roll 1d10 for each crew member. For each result of 1 or 2, the affected crew member is hit by a single hit with the same damage type as the hit that caused this effect, for an amount of damage equal to one quarter of the original damage (rounded up). In addition, the vehicle suddenly gains the Open Topped Vehicle trait, which could be a problem if the vehicle is in a poisonous atmosphere, underwater, or in a vacuum.",
      "As per the effect directly above, but the vehicle also catches fire!",
      "A short, sharp explosion flares outward from the vehicle. Armour panels fall off, weapons are blasted free, and the vehicle’s drive mechanisms are ruined, causing it to stop dead. The vehicle is now a shattered hulk and suffers the Vehicle Destroyed damage condition (see Section 7.1 “Repairing Vehicles”). Roll 1d10 for each remaining weapon on the vehicle; on a result of 5 or lower, the weapon in question suffers the Weapon Destroyed damage condition (see Section 7.1 “Repairing Vehicles”). Each character inside of the vehicle suffers 1d10+6 Explosive damage to a randomly determined Hit Location, and must make a Difficult (−10) Fortitude Test or become Stunned for 1d10 rounds. Skimmers automatically crash.",
      "The vehicle’s ammo supply, reactor or fuel supply takes a direct hit, and the vehicle erupts from within. Shards of molten metal are sent flying in every direction as the vehicle is reduced to a smoking crater. The vehicle is destroyed and cannot be repaired. No equipment from within the vehicle can be salvaged. The vehicle explodes, as per the Vehicles Exploding rules below.",
    ],
    undefined,
    { 8: 7 }
  ),
  createTable("vehicle", "motiveSystem", "veh crit tables.pdf PDF p. 1", [
    "A savage blow to the vehicle’s drive mechanism or legs forces the operator to fight to maintain control. He suffers 1 level of Fatigue and must make a Challenging (+0) Operate Test; if he fails, determine a random direction, this is the vehicle’s new facing.",
    "The vehicle is knocked violently from its current position, but otherwise does not take any major damage. It cannot move further than its Full Move distance until the end of the next round under its own power. Note it can still go Out of Control or otherwise be forced by alternate effects to move further than this would allow.",
    "One of the vehicle’s tracks, legs, or axles has taken a major hit, and now one side of the vehicle’s drive mechanism is responding more slowly than the other. The vehicle gains the Motive Systems Impaired Damage Condition (see Section 7.1 “Repairing Vehicles”).",
    "The vehicle’s fuel or drive power systems have taken a glancing hit. The vehicle is in no danger of exploding, but coaxing speed out of the engine is far more difficult now. If the operator attempts to take an action that would move the vehicle further than its Full Move distance, he must make a Difficulty (−10) Operate test. If he fails by three or more degrees of failure, the vehicle’s engine stalls, and it suddenly stops; if it is a Skimmer, the vehicle Crashes immediately.",
    "The driver finds that the vehicle’s control systems are completely unresponsive...but the vehicle is still moving! Tracked and Wheeled vehicles go Out of Control, Skimmers Crash, and Walkers move forward half their Tactical Speed or Full Movement before Falling Over. If the vehicle was stationary during the previous round, this result has no effect (though a Skimmer in midair still Crashes).",
    "The hit tears off a tread, damages a knee joint, or tears into the grav-generator, doing severe damage. The vehicle gains the Motive Systems Crippled damage condition (see Section 7.1 “Repairing Vehicles”). If this brings the Tactical Speed to 0, the vehicle suffers the Motive Systems Destroyed Damage Condition instead. It grinds to a halt; if midair, a Skimmer Crashes.",
    "The small internal explosion causes loose bolts to ricochet around the driver’s controls, or a control panel explodes in the driver’s face. He suffers 1 level of Fatigue, suffers 1d10 Impact damage to the Head Hit Location, and must make a Difficult (−10) Operate Test before he can move the vehicle next Turn. If the vehicle was already moving when this result occurred and the vehicle’s operator is unable to regain control, then the vehicle goes Out of Control.",
    "The vehicle’s motive systems are ripped apart in an explosion that immediately stops the vehicle from moving. The vehicle suffers the Motive Systems Destroyed damage condition (see Section 7.1 “Repairing Vehicles”). Skimmers that suffer this result Crash.",
    "The vehicle’s power systems or fuel tanks are penetrated. The vehicle grinds to a halt and immediately catches alight. The vehicle gains the Motive Systems Destroyed Damage Condition (see Section 7.1 “Repairing Vehicles”) and is now aflame (see On Fire! section below). Skimmers that suffer this result Crash.",
    "The vehicle immediately lurches forward before flipping over completely! Tracked Vehicles, Wheeled Vehicles, and Skimmers immediately move forward half their Tactical Speed and then flip over in a Crash. Walkers move forward half their Tactical Speed before Falling Over. Anything mounted on the top of the vehicle (turrets, equipment, and especially pintle mounted weapons) is destroyed. Exposed crew and passengers are thrown or crushed. Other weapons mounted on a vehicle’s hull can still be used, assuming there are any crew left to use them. The vehicle suffers the Motive Systems Destroyed Damage Condition (see Section 7.1 “Repairing Vehicles”); this cannot be repaired until the vehicle has first been turned right-side up again.",
  ]),
  createTable(
    "vehicle",
    "weapon",
    "veh crit tables.pdf p. 583",
    [
      "A strong concussive hit leaves the gun intact, but knocks the gunner away from his station. The gunner is Stunned for 1 round.",
      "A glancing blow knocks the gun about, dislodging an ammo linkage, buckling a breech door, or shorting out a power system. It is a minor issue, but will take time to fix. The weapon immediately Jams. The Jam can be cleared via the normal method.",
      "The hit frazzles the gun’s targeting system, blocks a vision slit or causes internal armour to flake away and strike the gunner in the eyes. All attacks made with the weapon suffer a −10 penalty for 1d5 rounds.",
      "With the sound of grinding metal, the gun locks in place. The gun suffers the Weapon/Turret Locked damage condition (see Section 7.1 “Repairing Vehicles”). The weapon is now only capable of firing in a direct straight line in whatever direction it happened to fire last (or directly forward if it had not fired yet). If the weapon was a Fixed weapon, treat this as the result 5 on this table.",
      "The gun’s ammo-hopper or power control system is destroyed, leaving the weapon incapable of loading ammunition. The weapon suffers the Weapon Disabled damage condition (see Section 7.1 “Repairing Vehicles”) until it has been repaired.",
      "The weapon’s targeting systems are annihilated by the blast. The weapon gains the Targeting Systems Destroyed damage condition (see Section 7.1 “Repairing Vehicles”).",
      "The gun’s ammo-hopper or power control systems are severely damaged, or perhaps the weapon’s barrel is cracked from a heavy impact. The weapon can still fire, but with a risk of causing an ammunition explosion. Every time the weapon is discharged, roll 1d10. On a result of 3 or higher, roll damage against the vehicle and any gunners manning the weapon as if the destroyed weapon had hit them, halving all damage rolled. If this happens, the weapon gains the Weapon Destroyed damage condition (see Section 7.1 “Repairing Vehicles”), and all the remaining ammunition in that clip is destroyed.",
      "The weapon explodes and is torn from its housing. Damage from the explosion rips further into the vehicle’s hull, possibly injuring the weapon’s gunner. For each gunner operating that weapon, roll 1d10; on a result of 1 or 2, that character is struck by a single hit with the same damage type as the hit that caused this effect and damage equal to one quarter (rounding up) of the damage the hit inflicted on the vehicle.",
      "As above, except the explosion rips through the entire crew compartment. Each character inside suffers 1 level of Fatigue, suffers 1d10+6 Explosive damage to his Body location, and must make a Challenging (+0) Dodge Test or catch on fire. If this occurs, refer to the On Fire! section below. Anyone who catches fire can attempt to put themselves out as described in the rules for characters being on fire in Section 9.3 “Conditions, Special Damage, & Damage States”.",
      "The force of the attack destroys the weapon and continues through into the vehicle’s hull, detonating the ammunition store or power supply for the weapon. The vehicle explodes immediately. It cannot be repaired and no equipment from within the vehicle can be salvaged. The vehicle explodes, as per the Vehicles Exploding rules below.",
    ],
    undefined,
    { 4: 5, 9: 8 }
  ),
  createTable(
    "vehicle",
    "turret",
    "veh crit tables.pdf p. 583",
    [
      "A strong concussive hit leaves the gun intact, but rattles those manning the location. Each character within the vehicle’s turret is Stunned for 1 round.",
      "A heavy blow knocks the turret aside, but it is not immediately apparent how much damage the gun has taken. The weapon is now Jammed (see Section 9.0 “Combat”).",
      "The hit frazzles the gun’s targeting system, blocks a vision slit or causes internal armour to flake away and strike the gunner in the eyes. All ranged attacks made with the weapon suffer a −10 penalty for 1d5 rounds.",
      "With the sound of grinding metal, the turret locks in place. The gun gains Weapon/Turret Locked damage condition (see Section 7.1 “Repairing Vehicles”). The weapon is now only capable of firing in a direct straight line in whatever direction it happened to fire at last (or directly forward if it had not fired yet). Pintle Weapons maintain their Fire Arcs even if a turret has jammed in place.",
      "The turret loses power, and everything stops working. The turret and the weapons contained within are undamaged, but nothing has any power and thus no weapons other than pintle weapons can be fired; the turret itself cannot rotate until the power systems are repaired. If the turret had any other equipment linked to it (such as additional searchlights, communications equipment and so on), these cease to operate. For the purposes of repairing damage, treat this as a Weapon Destroyed damage condition, but the weapons within the turret do not need to be replaced before a character can make the Repair test (see Section 7.1 “Repairing Vehicles”).",
      "The turret’s targeting systems are annihilated by the blast. Each non-pintle weapon mounted on the turret suffers the Targeting Systems Destroyed damage condition (see Section 7.1 “Repairing Vehicles”).",
      "The hit tears through the turret’s armour, leaving only useless shards of metal. All further hits to the vehicle’s turret now roll against the vehicle’s Rear facing Armour rather than the Front facing Armour, regardless of which direction the shot strikes the turret from. Treat the vehicle has having lost 2d10 AP for the purposes of repairing the Armour (see Reduced Armour). If hit came from a ranged attack, roll 1d10 for each crewmember. For each result of 1 or 2, the affected character is struck by a single hit with the same damage type as the hit that caused this effect, for an amount of damage equal to one quarter of the original damage (rounded up). The vehicle abruptly gains the Open Topped vehicle trait, which could be a problem if the vehicle is in a poisonous atmosphere, underwater, or in a vacuum.",
      "Several areas of the turret are blasted away and the entire turret catches fire. Any weapons mounted in or on the turret suffers the Weapon Destroyed damage condition. Any equipment on or in the turret is destroyed, and the turret itself gains the Weapon/Turret Locked damage condition. Additionally, the turret is set alight (see the On Fire! section below).",
      "As above, except the fire pours into the main hull of the vehicle, setting everything ablaze. Each character inside of the affected portions of the vehicle, as determined by the GM, must make a Challenging (+0) Dodge Test or catch on fire (see the On Fire! Section below). Anyone who catches fire can attempt to put himself out as described in the rules for Fire.",
      "A colossal explosion tears the turret away from the vehicle, the twisted wreckage flying into the air as the vehicle itself is ripped apart by secondary explosions. The vehicle is destroyed. It cannot be repaired and no equipment from within the vehicle can be salvaged. The vehicle explodes, as per the Vehicles exploding rules below. The turret itself flies 3d10 metres in a random direction, and inflicts a hit on anything it strikes as if the vehicle had used the Ram! action on that target after having moved its Tactical Speed.",
    ],
    undefined,
    { 9: 8 }
  ),
];

export const CRITICAL_LOCATION_GROUPS: ReadonlyArray<CriticalLocationGroup> = [
  {
    family: "humanoid" as const,
    label: "Humanoid",
    locations: [
      { id: "head" as const, label: "Head" },
      { id: "body" as const, label: "Body" },
      { id: "arm" as const, label: "Arm" },
      { id: "leg" as const, label: "Leg" },
    ],
  },
  {
    family: "vehicle" as const,
    label: "Vehicle",
    locations: [
      { id: "motiveSystem" as const, label: "Motive System" },
      { id: "hull" as const, label: "Hull" },
      { id: "weapon" as const, label: "Weapon" },
      { id: "turret" as const, label: "Turret" },
    ],
  },
];

export const CRITICAL_DAMAGE_TYPES: ReadonlyArray<CriticalDamageType> = [
  "Energy",
  "Explosive",
  "Impact",
  "Rending",
];
