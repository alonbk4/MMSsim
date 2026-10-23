<?php
/**
 * The first journal articles, written from the yard's own record: the
 * composter's temperature log, the two ferments, the biochar batch, the
 * pepper feeding log, and the fifteen-year Ann Arbor weather record the
 * simulator ships with.
 *
 * They install as drafts. They are written in the owner's voice, and nothing
 * goes out under someone's name until they have read it.
 *
 * Links point only at pages that are published from the start; a link to a
 * draft system would be a 404 for every visitor.
 */

defined( 'ABSPATH' ) || exit;

list( $p, $h, $ul, $you ) = require __DIR__ . '/markup.php';
$answer = require __DIR__ . '/answers.php';

$ask = function ( $lead ) use ( $p ) {
	return $p( $lead . ' <a href="/work-with-me/">Tell me about your yard</a>.' );
};

return array(

	'categories' => array(
		'principles' => 'Principles',
		'soil'       => 'Soil & compost',
		'water'      => 'Water',
		'food'       => 'Food',
	),

	'posts'      => array(

		array(
			'slug'     => 'why-i-write-down-what-failed',
			'title'    => 'Why this site writes down what failed',
			'category' => 'principles',
			'excerpt'  => 'Most garden advice is a list of things that worked somewhere else. This site keeps score in one Ann Arbor yard, failures included. Here is why.',
			'content'  =>
				$p( 'Most of what you can read about growing food, catching rain or making compost was written about somebody else’s yard. Some of it was tested. A lot of it was copied from something that was copied. Very little of it tells you what happens on a lot like yours, in this climate.' )
				. $p( 'So everything on this site carries a label for how sure I am:' )
				. $ul(
					array(
						'<strong>Works here</strong> — built in my yard, measured, and doing what it should.',
						'<strong>Partly worked here</strong> — built here; it worked some of the time, or less well than promised.',
						'<strong>Didn’t work here</strong> — built here, and it failed.',
						'<strong>Researched</strong> — well documented elsewhere, not yet built here.',
						'<strong>Unproven</strong> — promising on paper, contested in practice.',
					)
				)
				. $h( 'A failure is worth as much as a success' )
				. $p( 'A failure stops you spending another spring on the same idea. And it is the one thing no book about somebody else’s garden can tell you. When something fails here, it stays on the <a href="/systems/">systems menu</a>, marked as failed, and it is not something you can hire me to build.' )
				. $p( 'The first entries in the record were half-failures. My first nettle ferment and my first banana peel tea both grew mold and went on the compost heap. The second batch of each, weighted under the water, worked. So both are marked “partly worked here” — one failure and one success each — until the next batches settle it.' )
				. $h( 'Why it matters if you’re paying' )
				. $p( 'If you are going to spend money and a corner of your yard on something, you should know whether it has worked on a Michigan lot or only in a video from somewhere warmer. The labels are how I hold myself to that. Systems from the researched list are on the menu too, but if you choose one, we will both know it is an experiment and treat it like one: start small, measure it, write it up.' )
				. $h( 'Where the labels come from' )
				. $p( 'I keep the record in a planning tool I built, which models a yard across a full year using fifteen years of measured Ann Arbor weather. Every system in it carries one of these labels, and its estimates are wider or narrower depending on how sure we are. Marking something as working here narrows them. Over time, the record stops being a summary of other people’s claims and becomes a record of one real yard.' )
				. $ask( 'Curious what would hold up in yours?' ),
		),

		array(
			'slug'     => 'insulated-composter-first-month',
			'title'    => '130°F in five days: an insulated composter’s first month',
			'category' => 'soil',
			'excerpt'  => 'Loaded in mid-August with leaves, cardboard, dried food scraps and diluted urine, the bin hit 130°F in five days. Then it cooled — which is supposed to happen.',
			'content'  =>
				$p( 'In mid-August 2026 I loaded an insulated composter: a sealed bin of about a hundred gallons with insulated walls and a perforated air core down the middle. Here is what the temperature did over its first month, and what I took from it.' )
				. $h( 'What went in' )
				. $ul(
					array(
						'Shredded leaves and cardboard tubes, for carbon.',
						'Dried output from an electric food recycler, which is concentrated nitrogen.',
						'Diluted urine, for more nitrogen and moisture.',
					)
				)
				. $h( 'What the thermometer said' )
				. $ul(
					array(
						'<strong>Day 5:</strong> 130°F.',
						'<strong>The next week:</strong> held there, then eased to 120°F.',
						'<strong>The two weeks after:</strong> down to 80°F.',
						'<strong>Turned and recharged with fresh nitrogen:</strong> back to 125°F in a single day.',
					)
				)
				. $p( 'The drop to 80°F looks like a stall from outside. It isn’t. It is the normal end of a hot phase: the easy food is gone and the microbes slow down. What happened next proves it. Turned and fed, the bin went back to 125°F in one day, against five days from cold the first time, because the microbes were already there. They were hungry, not dead.' )
				. $h( 'What I would tell someone starting one' )
				. $ul(
					array(
						'Check it weekly, not daily. The temperature tells you when to act; it doesn’t need watching.',
						'When it cools, ask about moisture and air before you assume it has failed. A handful should feel like a wrung-out sponge.',
						'Expect the second hot cycle to be shorter than the first.',
						'Dried food-recycler output is a strong nitrogen charge. It is how I restart a load that is cooling.',
						'Keep woody material out. Branches belong in a chip pile or a biochar burn.',
					)
				)
				. $h( 'The honest caveats' )
				. $p( '130°F is just under the 131°F for three days that is usually quoted for killing weed seeds and pathogens, and a bin you keep adding to never holds any one batch that hot for long. So seeding weeds and anything diseased go elsewhere.' )
				. $p( 'The real test is still ahead. The insulation is the reason to own one this far north, where an open heap usually stops working around November. I will report how far into winter this one keeps going.' )
				. $p( 'The composter is on the <a href="/systems/hot-composter/">systems menu</a> with its cost, space and upkeep.' )
				. $ask( 'Want one fitted to your yard and your kitchen?' ),
		),

		array(
			'slug'     => 'moldy-ferments-one-line-fix',
			'title'    => 'Two moldy ferments and the one-line fix',
			'category' => 'soil',
			'excerpt'  => 'My first nettle ferment and my first banana peel tea both grew mold and went on the heap. The fix for both was the same: put a weight on it.',
			'content'  =>
				$p( 'In August I started two homemade liquid feeds: a fermented nettle tea, which is rich in nitrogen, and a banana peel tea, a mild potassium drench for plants in flower. Both first batches failed the same way. Both second batches worked. One thing was different.' )
				. $h( 'What went wrong' )
				. $p( 'In both jars, the plant material floated. Whatever sat above the waterline was in damp, still air, which is exactly what mold wants. The nettle grew a mat across the top. The banana peel grew fuzzy white and green patches. Underwater, a ferment has no air, and the microbes you want win. Above the water, mold wins.' )
				. $p( 'Both batches went on the compost heap — not on the grow bags, and not into the aquaponics tank. When a liquid feed has gone wrong, don’t use it to find out what it does.' )
				. $h( 'The fix' )
				. $p( 'Weigh it down. A plate, a jar filled with water, a clean stone in a mesh bag — anything that keeps every bit of plant below the surface. Weighted, both second batches went the way they should: the nettle with no mold and a smell that lives up to its reputation, the banana peel tea clean.' )
				. $h( 'The recipes, as I make them now' )
				. $h( 'Nettle', 3 )
				. $ul(
					array(
						'About two pounds of chopped young nettle tops to two and a half gallons of water.',
						'Weighted under, loosely covered, stirred every few days.',
						'Ready when it stops bubbling, usually two to three weeks.',
						'Dilute 1:10 for the soil and 1:20 for leaves. Stop feeding it to fruiting plants once they flower.',
					)
				)
				. $h( 'Banana peel', 3 )
				. $ul(
					array(
						'Four chopped peels to a quart of water.',
						'Weighted under, loosely covered, for two to five days.',
						'Dilute 1:4 and use it on the soil only, never on leaves. It keeps a week in the fridge.',
						'Freeze peels until you have enough for a batch.',
					)
				)
				. $h( 'What they’re worth' )
				. $p( 'Nettle is a real source of nitrogen if you grow enough of it. A two-pound batch needs a patch of about ten square feet; a single clump makes enough for about a quart. Banana peel tea is weaker than its reputation. A peel holds about as much potassium as the compost it would have gone into anyway — the tea only moves it to the plant at flowering.' )
				. $p( 'Both are on the <a href="/systems/">systems menu</a> as “partly worked here,” one failure and one success each. The next batches decide whether they move up.' ),
		),

		array(
			'slug'     => 'charge-your-biochar',
			'title'    => 'Raw biochar steals nitrogen. Charge it first.',
			'category' => 'soil',
			'excerpt'  => 'Biochar can hold nutrients in your soil for decades, but fresh char does the opposite for its first season. Here is how I charged a batch made from yard waste, buckthorn included.',
			'content'  =>
				$p( 'Biochar is charcoal made for the soil: wood heated with too little air to burn completely, leaving a skeleton of carbon full of tiny pores. In the ground it holds water and nutrients that would otherwise wash through, and it lasts for decades.' )
				. $p( 'How much it helps depends on the soil. The dramatic results come from poor, weathered soils; on good loam the effect can be small. And the part the pitch usually leaves out is that fresh char is empty, and empty char pulls nitrogen and water out of whatever it touches. Dig raw char into a bed and the bed goes backwards for a season.' )
				. $h( 'Charging it' )
				. $p( $answer['biochar_article'] )
				. $ul(
					array(
						'Crush it first. Smaller pieces charge faster and mix in better.',
						'Soak it in something rich: diluted urine, compost tea, fish-tank water, or mix it straight into finished compost.',
						'Give it two to four weeks.',
						'Then mix it into compost or a bed. As a top dressing it just blows away.',
					)
				)
				. $h( 'Where the wood comes from: buckthorn' )
				. $p( 'Buckthorn is one of the most troublesome invasive shrubs in Southeast Michigan, and clearing it leaves a pile of wood. Burning it is a fine use of an invasive. Charring the bigger rounds is better: ash is a single season’s dose of minerals, while char stays in the soil for decades. Bag the berries for the trash rather than composting them — a backyard heap rarely gets hot enough to kill the seeds.' )
				. $h( 'And the ash' )
				. $p( 'Whatever you burn rather than char leaves ash, which is useful in small doses. Hardwood ash is 3–7% potassium, and with a pH of 9 to 11 it works as lime at least as much as fertilizer.' )
				. $ul(
					array(
						'In the ground, keep it to a pound or two per hundred square feet a year.',
						'In a grow bag, a tablespoon or two once a season, watered in.',
						'Keep it away from potatoes: above pH 7, potato scab gets much worse.',
						'Store it dry, since rain washes the potassium out.',
						'Never use ash from charcoal briquettes, or from painted or treated wood.',
					)
				)
				. $p( 'Check your city’s or township’s rules before any open burn.' )
				. $p( 'The full setup is on the <a href="/systems/biochar/">systems menu</a>.' )
				. $ask( 'Clearing buckthorn and wondering what to do with the pile?' ),
		),

		array(
			'slug'     => 'ann-arbor-garden-water-july',
			'title'    => 'Why an Ann Arbor garden still needs water in July',
			'category' => 'water',
			'excerpt'  => 'Ann Arbor gets about 36 inches of rain a year. From June to August, the air pulls about six inches more out of the ground than falls. Here are the numbers, and what they mean for rain barrels.',
			'content'  =>
				$p( 'Ann Arbor gets about 36 inches of rain a year, spread fairly evenly across the months. It is easy to conclude that a garden here should look after itself. Then July comes, the beds wilt, and the hose comes out.' )
				. $p( 'The reason is in two numbers: how much rain falls, and how much water the air pulls back out of the soil and the leaves, which agronomists call evapotranspiration. I averaged both over fifteen years of measured Ann Arbor weather, 2010 to 2024:' )
				. $ul(
					array(
						'<strong>May:</strong> 3.7 inches of rain, 4.7 pulled back out — 1 inch short.',
						'<strong>June:</strong> 3.6 inches of rain, 5.6 pulled out — 2.1 inches short.',
						'<strong>July:</strong> 3.5 inches of rain, 5.8 pulled out — 2.3 inches short.',
						'<strong>August:</strong> 3.1 inches of rain, 5.0 pulled out — 1.9 inches short.',
						'<strong>September:</strong> 2.9 inches of rain, 3.7 pulled out — 0.8 inches short.',
					)
				)
				. $p( 'From June to August, the air takes about six and a quarter inches more than falls. Over the whole year the two nearly cancel — 36 inches in, 37 out — but the timing is what matters. The surplus arrives in spring and fall, when the garden needs it least. The shortfall lands in summer, when it needs it most.' )
				. $h( 'What that means for one bed' )
				. $p( 'Averaged over July, a 100-square-foot bed at full growth is short about half an inch of water a week after the rain: roughly 30 gallons. Mulch cuts that, because much of the loss from bare soil is plain evaporation, and a young bed uses less than a full one. But a hot, dry week can easily double it, and an average hides the dry Julys.' )
				. $h( 'The rain barrel problem' )
				. $p( 'Your roof catches far more than a barrel holds. An inch of rain on a 1,000-square-foot roof is about 600 gallons. One downspout draining a quarter of that roof delivers well over 100 gallons in a single one-inch storm, and a typical rain barrel holds 55. In Ann Arbor, catching rain is rarely the problem. Storing it is.' )
				. $p( 'Carrying that 100-square-foot bed through the summer shortfall on stored rain alone would take roughly 400 gallons, less whatever summer storms top back up. So the useful questions are how much storage you can fit, and how to make the soil itself hold more: mulch, compost, and a rain garden or swale that soaks runoff into the ground instead of sending it to the storm drain.' )
				. $h( 'Where the numbers come from' )
				. $p( 'Monthly averages for 2010–2024 from the ERA5 reanalysis, via Open-Meteo (CC BY 4.0) — the same record behind the planning tool I use for every yard. Evapotranspiration here is the standard reference figure for short, well-watered grass; real plants use more or less depending on the crop, the stage and the mulch. Treat it as the shape of the problem, not a prescription.' )
				. $ask( 'Want storage sized to your roof and your beds?' ),
		),

		array(
			'slug'     => 'hanging-peppers-one-pump',
			'title'    => 'Sixteen hanging peppers, one pump, one timer',
			'category' => 'food',
			'excerpt'  => 'Peppers growing upside down out of felt bags, all watered by one small pump on an app timer. What it takes to keep sixteen of them alive through a heatwave.',
			'content'  =>
				$p( $you( 'Check every number here against your own feeding log before publishing, and add a photo of the rail.' ) )
				. $p( 'The setup: felt bags about 9 by 15 inches, each holding about three and a half gallons of mix, hung from a rail with the plant growing out of a hole in the bottom. The open top takes the water. A small pump sits in a reservoir, and an app timer runs sixteen drip emitters.' )
				. $h( 'Where the water goes' )
				. $p( 'Gravity is on your side in an upside-down bag. An emitter in the center of the top wets the column of mix down toward the roots. One at the edge just runs down the inside of the felt and out of the bottom, and the plant goes thirsty while the bag looks watered.' )
				. $p( 'The cost of growing this way is the root zone: small, warm, and draining on every side. A pepper in one of these wants water every day, twice in a heatwave. And every watering carries nutrients out of the bottom, so it needs feeding every ten to fourteen days.' )
				. $h( 'One timer, sixteen plants' )
				. $p( 'The kit treats every emitter the same, so seven pepper varieties get one schedule. To calibrate it:' )
				. $ul(
					array(
						'Run one cycle and time how long until water drips from the bottom of the bags.',
						'Set the timer about a fifth shorter than that, so the water stops just before it runs through.',
						'Check moisture where the stem comes out, not at the top — the top dries first and lies to you.',
						'Lift the odd one out. A bag that is much lighter than its neighbors is the one the schedule is failing.',
					),
					true
				)
				. $h( 'The weak point is the reservoir' )
				. $p( 'Sixteen bags in a heatwave can drink five gallons a day. Either someone tops the reservoir up daily, or it is fed from a rain tank — which is where a kit like this really earns its place, because then it waters at six in the morning in July whether anyone is home or not.' )
				. $p( 'Expect one to three pounds of fruit per plant.' )
				. $ask( 'Got a fence, a porch rail or a patio and no ground worth digging?' ),
		),
	),
);
