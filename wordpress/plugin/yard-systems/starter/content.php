<?php
/**
 * Starter content, written from the yard's own record (the simulator's
 * YARD_LOG and catalog notes).
 *
 * [[YOU: …]] marks what only the owner can write. The dashboard counts
 * published pages that still contain one, so none go live by accident.
 *
 * Systems whose result in this yard is on record are published with that
 * result. The rest are drafts: they are on the yard's list, but nothing says
 * how they have done here, and the menu should not claim it.
 */

defined( 'ABSPATH' ) || exit;

list( $p, $h, $ul, $you ) = require __DIR__ . '/markup.php';

return array(

	'tagline'    => 'Clever, low-cost systems for water, food and soil that work with the yard you already have. Ann Arbor, Michigan.',

	'categories' => array(
		'soil'  => array(
			'name'        => 'Soil & fertility',
			'description' => 'Turning kitchen scraps, yard waste and woody junk into the stuff that grows the food.',
		),
		'food'  => array(
			'name'        => 'Food',
			'description' => 'Growing it — in the ground, in bags, on walls and in water — wherever the yard has room and sun.',
		),
		'water' => array(
			'name'        => 'Water',
			'description' => 'Catching the rain that already falls on the place, keeping it, and getting it to the roots.',
		),
	),

	/* ============================== PAGES ============================== */

	'pages'      => array(

		'home'         => array(
			'title'   => 'Home',
			'order'   => 0,
			'content' => "<!-- wp:pattern {\"slug\":\"working-yard/home\"} /-->\n",
		),

		'the-yard'     => array(
			'title'   => 'The yard',
			'order'   => 10,
			'excerpt' => 'One Ann Arbor yard, the systems running in it, and what happened when each one was tried.',
			'content' =>
				$p( $you( 'Two or three sentences on who you are, how long you’ve been in Ann Arbor, and what got you started on this yard. Plain is better than polished.' ) )
				. $h( 'What’s running here' )
				. $p( 'An insulated hot composter fed by the kitchen. Biochar, made from woody waste and soaked until it is ready for soil. An aquaponics system built in an IBC tote, whose water ends up feeding half of the others. A nettle patch for fermented plant feed. Hanging peppers on a timed drip. ' . $you( 'Check this list against the yard and add what’s missing.' ) )
				. $p( 'Each one is on the <a href="/systems/">systems page</a> with how it has actually done here.' )
				. $h( 'How it fits together' )
				. $p( 'Very little here works alone. Each system runs on something another one throws away:' )
				. $ul(
					array(
						'Kitchen scraps go through an electric food recycler, and the dried output goes into the hot composter as a nitrogen charge when it starts to cool.',
						'Water from the aquaponics tank is the base for worm tea, the liquid that charges the biochar, and what wets a fresh load of compost.',
						'Diluted urine — the most nitrogen a household makes — charges the biochar and restarts a stalling compost load.',
						'Cleared buckthorn, an invasive, becomes char instead of a burn pile.',
					)
				)
				. $p( 'That is the main idea behind the whole yard: the inputs are things you already have, which is why none of it has to be expensive.' )
				. $h( 'Keeping score' )
				. $p( 'I also built a planning tool that models a yard over a full year: sun and shade cast by the actual trees and fences, fifteen years of measured Ann Arbor weather, and what every system needs and produces. Every system in it is marked by how sure we are that it works, from “someone wrote it down somewhere” to “I watched it happen in my own garden.”' )
				. $p( 'When something works here, it gets marked as working. When it fails, that is recorded too. A failure is the one thing no book about someone else’s garden can tell you.' )
				. $h( 'What went wrong' )
				. $p( 'In August 2026 the first nettle ferment and the first banana peel tea both floated, grew a mat of mold, and went onto the compost heap. The second batch of each was weighted under the water and worked. The fix was a weight. It is written up on both systems, because it is the most useful thing I learned all summer.' )
				. $p( $you( 'Anything else that failed or surprised you. This is the paragraph people trust the most.' ) ),
		),

		'principles'   => array(
			'title'   => 'Principles',
			'order'   => 20,
			'excerpt' => 'The ideas behind every system here, and behind what I will and won’t recommend for your yard.',
			'content' =>
				$h( 'Work with the place as it stands' )
				. $p( 'A shady lot, a wet corner, a slope, a yard full of mature trees: the usual answer is to change the site — regrade it, take the trees down, bring in machines. That is where the five-figure quotes come from. The other way is to choose systems that suit the place the way it is. A composter that is happy in part shade. A rain garden where the water already goes. Peppers that hang where there is no ground to dig.' )
				. $h( 'Cheap, fixable and understandable' )
				. $p( 'A bucket, a pump and a timer beat a sealed box you cannot repair. If you cannot see how something works, you cannot fix it on a Sunday — and you will be paying someone else to.' )
				. $h( 'Every output is another system’s input' )
				. $p( 'Fish water feeds the worm tea. Kitchen scraps feed the compost. Woody waste becomes char, and the char holds the nutrients the compost would otherwise lose to the rain. The more of these loops a yard closes, the less you buy.' )
				. $h( 'Write down what failed' )
				. $p( 'Every system on this site carries a label: works here, partly worked here, didn’t work here, or not yet tried here. The failures stay on the list. You should know how something does on a Michigan lot before you pay for it.' )
				. $h( 'Plan with the real weather' )
				. $p( 'Ann Arbor gets about 36 inches of rain a year, which sounds like plenty. But from June to August, plants and soil lose about six inches more water to the air than falls — measured over fifteen years of weather. That is why a garden here still needs watering in July, and why storing spring rain is worth doing.' )
				. $h( 'Be honest about the upkeep' )
				. $p( 'Every system lists the time it really takes. An aquaponics tank needs someone every day. A rain garden needs almost no one. Both are good systems; they suit different households.' )
				. $h( 'Start small' )
				. $p( 'One system, one season, then the next. A yard that grows in steps teaches you what it wants. A yard built all at once teaches you what you can’t afford to maintain.' ),
		),

		'work-with-me' => array(
			'title'   => 'Work with me',
			'order'   => 30,
			'excerpt' => 'How a consultation works, what it costs, and what I will and won’t do.',
			'content' =>
				$p( 'I help homeowners in and around Ann Arbor add systems that make their place more productive and less dependent — without remaking the yard first.' )
				. $h( 'How it works' )
				. $ul(
					array(
						'<strong>Send a note.</strong> Use the form below. Tell me about the place, and tick anything from the <a href="/systems/">systems menu</a> that caught your eye.',
						'<strong>Come and see mine, if you like.</strong> The systems are running in my yard, and seeing them is better than any photo. <a href="/visit/">Visits</a> are by appointment.',
						'<strong>I walk your yard.</strong> Sun and shade through the year, where the water goes, the soil, what is already there, and what has been a headache. ' . $you( 'What this visit costs, or that the first one is free. Publishing a price filters out people who aren’t serious and reassures the ones who are.' ),
						'<strong>You get a short plan.</strong> Which systems fit, where they go, what they cost, and how much of your time they will take each week.',
						'<strong>We build it.</strong> ' . $you( 'Say what you build yourself and what you teach the owner to build. If you install for pay, check what Michigan licensing that needs first.' ),
					),
					true
				)
				. $h( 'What I won’t do' )
				. $ul(
					array(
						'Sell you something I haven’t run myself, or can’t explain.',
						'Recommend tearing out something that already works.',
						'Skip a permit or a licensed trade. Anything that touches electrical or plumbing gets a licensed electrician or plumber, and I will say so up front.',
					)
				)
				. $h( 'Get in touch' )
				. "<!-- wp:yard-systems/inquiry-form /-->\n",
		),

		'visit'        => array(
			'title'   => 'Visit the yard',
			'order'   => 40,
			'excerpt' => 'See the systems running before you decide on any of them. By appointment.',
			'content' =>
				$p( 'A compost bin at 130°F and a fish tank feeding a grow bed are more convincing in person than in any photo. Most of what is on the menu is running here, and you are welcome to come and see it.' )
				. $h( 'How visits work' )
				. $ul(
					array(
						'Visits are by appointment. Send a note through the <a href="/work-with-me/#inquiry">inquiry form</a> and tick “See your yard and the systems in person.”',
						'I will suggest a time, and send the address with the confirmation. It is a home as well as a demonstration, so the address isn’t published.',
						'Wear shoes you don’t mind getting muddy.',
						$you( 'How long a visit runs, how many people at once, whether kids and dogs are welcome, and whether there is a fee.' ),
					)
				)
				. $h( 'What you will see' )
				. "<!-- wp:yard-systems/system-menu /-->\n",
		),

		'journal'      => array(
			'title'   => 'Journal',
			'order'   => 50,
			'content' => '',
		),
	),

	/* ============================= SYSTEMS ============================= */

	'systems'    => array(

		array(
			'slug'     => 'hot-composter',
			'title'    => 'Insulated hot composter',
			'category' => 'soil',
			'tier'     => 'works',
			'status'   => 'publish',
			'summary'  => 'A sealed, insulated bin with an air core down the middle. Hot compost from kitchen scraps and leaves in a few square feet, and it keeps going after an open heap has frozen.',
			'facts'    => array(
				'ys_cost'   => 'About $230 for the bin',
				'ys_space'  => 'A 3 × 3 ft pad. Part shade is fine.',
				'ys_upkeep' => 'A weekly temperature check; turn and recharge when it cools',
				'ys_season' => 'Spring into early winter',
				'ys_fits'   => 'Small yards and kitchen-scrap households who want compost without an open heap',
			),
			'content'  =>
				$h( 'What happened here' )
				. $p( 'I loaded it in mid-August 2026 with shredded leaves, cardboard tubes, dried food-recycler output and diluted urine. It reached 130°F within five days and held there for about a week, then eased to 120°F and down to 80°F over the next two weeks.' )
				. $p( 'That drop looks like a stall from outside. It isn’t — it is the normal end of a hot phase. Turned and recharged with fresh nitrogen, it was back at 125°F in a single day, against five days from cold, because the microbes were already there and only hungry.' )
				. $h( 'What to expect' )
				. $ul(
					array(
						'Check it weekly, not daily. When the temperature drops, ask about moisture and compaction before you assume something is wrong.',
						'The second hot cycle is shorter than the first.',
						'It takes no woody material — that goes to the biochar instead.',
						'The air core cuts down on turning. It doesn’t remove it.',
					)
				)
				. $h( 'Why insulated' )
				. $p( 'This far north, an open heap stops working around November. The insulation is meant to carry it into December. This is the bin’s first winter here, and I will report how far it gets.' ),
		),

		array(
			'slug'     => 'biochar',
			'title'    => 'Biochar, made and charged',
			'category' => 'soil',
			'tier'     => 'works',
			'status'   => 'publish',
			'summary'  => 'Woody waste — prunings, cleared buckthorn — turned into char, then soaked in nitrogen until it feeds the soil instead of robbing it.',
			'facts'    => array(
				'ys_cost'   => 'About $45 for a charging tote; the wood is waste you already have',
				'ys_space'  => 'A safe spot to burn, and room for a 27-gallon tote',
				'ys_upkeep' => 'A day to make a batch; a stir now and then for 2–4 weeks while it charges',
				'ys_season' => 'Burn in dry weather; charge any time above freezing',
				'ys_fits'   => 'Yards with woody waste, especially anyone clearing buckthorn',
			),
			'content'  =>
				$h( 'What happened here' )
				. $p( 'I made a batch in August 2026, crushed it, and charged it in a 27-gallon tote with diluted urine and water from the aquaponics tank. Then it went into the hot composter.' )
				. $h( 'The step people skip' )
				. $p( 'Raw char is mostly surface area, and empty surface area pulls nitrogen and water out of whatever it touches. Put it straight on a bed and the bed goes backwards for a season. Two to four weeks soaking in something rich — urine, compost tea, fish water — fills it up first. After that, the same property makes it a reservoir: it holds nutrients that would otherwise wash out of the soil.' )
				. $h( 'Buckthorn' )
				. $p( 'Burning cleared buckthorn is a good use of an invasive. Charring the larger rounds is better: ash is a one-season dose of minerals, while char stays in the soil for decades. Bag the berries rather than composting them.' )
				. $p( 'Check the city’s rules on open burning before you light anything.' ),
		),

		array(
			'slug'     => 'aquaponics',
			'title'    => 'IBC aquaponics',
			'category' => 'food',
			'tier'     => 'works',
			'status'   => 'publish',
			'summary'  => 'Fish and a grow bed on one pump, built from a reused IBC tote. A lot of food per square foot, and its water feeds half the other systems here.',
			'facts'    => array(
				'ys_cost'   => 'Roughly $300–650, mostly the pump, media and fish',
				'ys_space'  => 'About 2 ft² of floor for every 1 ft² of grow bed, near power',
				'ys_upkeep' => 'Feeding and a look every day; water tests weekly',
				'ys_fits'   => 'Households who are home most days and enjoy tending something',
			),
			'content'  =>
				$h( 'What happened here' )
				. $p( 'It had a rough start with the fingerlings. By June 2026 it was stable and has run reliably since. ' . $you( 'Say what went wrong at the start and what fixed it — that’s the part a buyer most needs.' ) )
				. $p( 'Its water does more work than the fish do. It is the base for worm tea, the soak that charges the biochar, and what wets each new load in the hot composter.' )
				. $h( 'The honest part' )
				. $ul(
					array(
						'The pump is life support. A day without power kills the fish, and then the bacteria. Plan for outages.',
						'Fish food is usually bought, so some of the fertility the system seems to make is really imported in the bag.',
						'It needs someone every day. If you travel a lot, choose something else from the menu.',
						$you( 'Where yours runs in winter, and how you keep the water warm enough.' ),
					)
				),
		),

		array(
			'slug'     => 'nettle-feed',
			'title'    => 'Nettle patch & fermented feed',
			'category' => 'soil',
			'tier'     => 'partial',
			'status'   => 'publish',
			'summary'  => 'A contained bed of stinging nettle, cut every few weeks and fermented into a high-nitrogen liquid feed.',
			'facts'    => array(
				'ys_cost'   => 'Little — a few plants and a root barrier',
				'ys_space'  => 'About 10 ft², contained. Part shade is fine.',
				'ys_upkeep' => 'A cut every 3–4 weeks in season; each ferment takes 2–3 weeks',
				'ys_season' => 'Cut from spring to late summer',
				'ys_fits'   => 'Anyone growing heavy feeders who doesn’t mind a smell',
			),
			'content'  =>
				$h( 'What happened here' )
				. $p( 'The first ferment, in August 2026, floated, grew a mat of mold and was dumped. The second was weighted under the water and went the way it should: no mold, and a smell that lives up to its reputation. One of two is why this is marked “partly worked.” The next batch should move it up.' )
				. $h( 'Doing it right' )
				. $ul(
					array(
						'Contain it before you encourage it. Nettles spread by roots, so sink a barrier 8–12 inches deep, or mow around it weekly.',
						'Cut the top 4–6 inches of young growth, never more than a third of the plant. It is back in three to four weeks.',
						'About two pounds of chopped nettle to two and a half gallons of water, weighted under, loosely covered, stirred now and then, until it stops bubbling.',
						'Dilute 1:10 for the soil and 1:20 for leaves. Stop feeding it to anything grown for fruit once it flowers.',
					)
				),
		),

		array(
			'slug'     => 'banana-peel-tea',
			'title'    => 'Banana peel tea',
			'category' => 'soil',
			'tier'     => 'partial',
			'status'   => 'publish',
			'summary'  => 'Peels steeped for a few days as a potassium drench at flowering. Cheap and quick — and weaker than its reputation.',
			'facts'    => array(
				'ys_cost'   => 'Nothing: a jar and your peels',
				'ys_space'  => 'A jar on the counter',
				'ys_upkeep' => 'Ten minutes a batch; 2–5 days to steep',
				'ys_season' => 'Use it at flowering',
				'ys_fits'   => 'Container growers who want to see what it does',
			),
			'content'  =>
				$h( 'What happened here' )
				. $p( 'The first batch, in August 2026, grew fuzzy white and green mold on the peel that floated above the water. It went on the compost heap, not on the plants and not into the aquaponics. The second batch, weighted under, worked. A weight on top is the whole fix.' )
				. $h( 'What it actually does' )
				. $p( 'Some potassium and not much else. A peel is about as rich as the compost it would otherwise have gone into, so this mostly moves that potassium to where the plant is when it flowers. It doesn’t add a new source.' )
				. $ul(
					array(
						'Four peels to a quart of water, chopped, held fully under with a weight, loosely covered, for two to five days.',
						'Use it 1:4 as a soil drench, never on leaves. It keeps a week at most in the fridge.',
						'Freeze peels between batches.',
					)
				),
		),

		/* ---- On the yard's list, result not yet recorded: drafts ---- */

		array(
			'slug'     => 'hanging-peppers',
			'title'    => 'Hanging peppers on a timed drip',
			'category' => 'food',
			'tier'     => 'researched',
			'status'   => 'draft',
			'summary'  => 'Felt bags hung from a rail with the plant growing out of the bottom, all watered by one small pump and an app timer.',
			'facts'    => array(
				'ys_cost'   => 'About $6 a bag, plus about $60 for the pump kit',
				'ys_space'  => 'A sunny rail or fence line; almost no ground',
				'ys_upkeep' => 'Top up the reservoir; feed every 10–14 days',
				'ys_season' => 'Late May to the first frost',
				'ys_fits'   => 'Patios, rooftops and yards with no ground worth digging',
			),
			'content'  =>
				$p( $you( 'Is this running in your yard, and how has it done? Set the tier in the sidebar, then publish.' ) )
				. $p( 'Each bag holds about three and a half gallons of mix, hung so the plant grows out of the hole in the bottom. Put the emitter in the center of the top so the water soaks down through the mix — one at the edge just runs down the felt. Sixteen bags can drink five gallons a day in a heatwave, so the reservoir is the weak point: top it up daily, or feed it from a rain tank. One timer treats every variety the same, so check moisture where the stem comes out, not at the top.' ),
		),

		array(
			'slug'     => 'felt-grow-bags',
			'title'    => 'Felt grow bags',
			'category' => 'food',
			'tier'     => 'researched',
			'status'   => 'draft',
			'summary'  => 'Fabric pots that prune their own roots. Portable, forgiving of bad ground, and thirsty.',
			'facts'    => array(
				'ys_cost'   => 'About $7 a bag, plus mix',
				'ys_space'  => 'Anywhere with sun — paving, a rented yard, contaminated ground',
				'ys_upkeep' => 'Water often in summer; refresh the mix every year or two',
				'ys_season' => 'Late spring to frost',
				'ys_fits'   => 'Renters, paved yards, and anyone chasing the sun around a shady lot',
			),
			'content'  =>
				$p( $you( 'Is this running in your yard, and how has it done? Set the tier, then publish.' ) )
				. $p( 'A 15-gallon bag gives about what the same footprint gives in a bed. Fabric dries from every side, so it needs about a third more water than the ground, and a missed day in July kills the plant instead of setting it back. The mix is bought, not grown, so refreshing it is the real running cost.' ),
		),

		array(
			'slug'     => 'worm-tea',
			'title'    => 'Worm bin & aerated worm tea',
			'category' => 'soil',
			'tier'     => 'unproven',
			'status'   => 'draft',
			'summary'  => 'Castings, a spoon of molasses and an aquarium air stone for a day. A microbial drench rather than a fertilizer.',
			'facts'    => array(
				'ys_cost'   => 'About $25 for the brewer, plus a worm bin',
				'ys_space'  => 'A bucket by the back door',
				'ys_upkeep' => 'A day to brew; use it within four hours',
				'ys_fits'   => 'Anyone already keeping worms',
			),
			'content'  =>
				$p( $you( 'Is this running in your yard? It starts as Unproven because the trials are genuinely mixed; your beds are the only trial that settles it.' ) )
				. $p( 'A cup of castings to about five quarts of dechlorinated water, a tablespoon of unsulfured molasses, and an air stone running for 24 to 36 hours. Foam on top means it is working. Without the air it turns into anaerobic leachate, which is a different and worse thing. Water from a stable aquaponics system makes a richer base: draw it in the morning before feeding the fish, and cut it half and half.' ),
		),

		array(
			'slug'     => 'rain-garden',
			'title'    => 'Rain garden',
			'category' => 'water',
			'tier'     => 'researched',
			'status'   => 'draft',
			'summary'  => 'A planted hollow that takes roof and driveway runoff and puts it into the ground instead of the storm drain.',
			'facts'    => array(
				'ys_cost'   => 'About $3 a square foot, much less if you dig it yourself',
				'ys_space'  => 'A tenth to a fifth of the hard surface draining into it, at least 10 ft from the house',
				'ys_upkeep' => 'Weeding in its first two years, then very little',
				'ys_fits'   => 'Yards with a soggy spot, a downspout dumping on the lawn, or a slope',
			),
			'content'  =>
				$p( $you( 'Is this in your yard, or something you would build for others? Set the tier, then publish.' ) )
				. $p( 'Two things decide whether it works. It has to drain within a day or two — a percolation test tells you, not an opinion. And it has to sit at least ten feet from a foundation. Drained properly it doesn’t breed mosquitoes; a hollow that holds water for a week does.' ),
		),

		array(
			'slug'     => 'rain-tank',
			'title'    => 'Rain tank with first-flush diverter',
			'category' => 'water',
			'tier'     => 'researched',
			'status'   => 'draft',
			'summary'  => 'Gutter water stored for July, with the dirtiest first minutes of every storm thrown away before they reach the tank.',
			'facts'    => array(
				'ys_cost'   => 'About $50 a diverter; tanks from about $1 a gallon',
				'ys_space'  => 'Beside a downspout, on level, solid ground',
				'ys_upkeep' => 'Clean the diverter a few times a season; drain it before the hard freeze',
				'ys_season' => 'April to November',
				'ys_fits'   => 'Any house with gutters and a garden that dries out in summer',
			),
			'content'  =>
				$p( $you( 'Is this in your yard? Set the tier, then publish.' ) )
				. $p( 'An inch of rain on 1,000 square feet of roof is about 600 gallons. The diverter throws the first of it away — the bird droppings, grit and pollen sitting on the roof — so the tank stays clean instead of growing a sludge layer. Budget one diverter per downspout.' ),
		),

		array(
			'slug'     => 'bucket-drip',
			'title'    => 'Gravity bucket drip',
			'category' => 'water',
			'tier'     => 'researched',
			'status'   => 'draft',
			'summary'  => 'A bucket on a stand feeding drip tape by gravity. No pump, no pressure, no power.',
			'facts'    => array(
				'ys_cost'   => 'About $26 a kit',
				'ys_space'  => 'A stand about three feet high at the end of a bed',
				'ys_upkeep' => 'Fill the bucket, up to twice a day in July — or feed it from a tank uphill',
				'ys_fits'   => 'Beds far from a tap, and households that would rather not run pumps',
			),
			'content'  =>
				$p( $you( 'Is this in your yard? Set the tier, then publish.' ) )
				. $p( 'Three feet of height is enough to run two lines of drip tape over about 250 square feet, using about a third less water than a hose. The cost is your legs: someone carries and fills that bucket. Put a rain tank uphill and that labour disappears.' ),
		),

		array(
			'slug'     => 'trellises',
			'title'    => 'Grow trellises',
			'category' => 'food',
			'tier'     => 'researched',
			'status'   => 'draft',
			'summary'  => 'Beans, cucumbers and small squash grown up instead of out. More food from the same bed, and less mildew.',
			'facts'    => array(
				'ys_cost'   => 'About 40¢ per square foot of bed',
				'ys_space'  => 'No extra ground — on the north side of a bed, so it doesn’t shade the rest',
				'ys_upkeep' => 'Tying in during the season',
				'ys_season' => 'Summer',
				'ys_fits'   => 'Small beds that need to produce more',
			),
			'content'  =>
				$p( $you( 'Is this in your yard? Set the tier, then publish.' ) )
				. $p( 'A vining crop grown up rather than sprawling yields about 40% more, and the moving air keeps mildew down. The costs are real: more leaf in the wind means more water, and a trellis on the sunny side of a bed shades everything behind it.' ),
		),
	),
);
