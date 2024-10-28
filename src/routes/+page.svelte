<script lang="ts">
	import { World } from '$lib';

	const world = new World<{ mana: number; position: [number, number, number] }>([]);

	const player = world.spawn({ mana: 10 });

	player.mana -= 1;

	world.observe(player, (changes) => console.log(changes));

	world.update(player, { mana: 5,  position: [0, 0, 0] });

</script>
