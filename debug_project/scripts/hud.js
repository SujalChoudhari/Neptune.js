export function renderRpgHud({ inventory, questLog, location, paused = false }) {
    const root = globalThis.document?.getElementById("rpg-hud");
    if (!root || !inventory) return;

    const items = inventory.slots.map(({ item, quantity }) => `${item.name} ×${quantity}`);
    const equipment = Object.entries(inventory.equipment)
        .map(([slot, item]) => `${slot}: ${item.name}`);
    const quest = questLog?.data.quests.get("slimeTrouble");
    const state = questLog?.states.get("slimeTrouble");
    const objective = quest?.objectives[0];
    const progress = objective ? state?.progress[objective.id] ?? 0 : 0;
    const questLine = objective && state
        ? `${quest.name}: ${progress}/${objective.required} (${state.status})`
        : "No active quest";

    root.textContent = [
        `Area: ${location}`,
        `Inventory: ${items.length ? items.join(", ") : "empty"}`,
        `Equipment: ${equipment.length ? equipment.join(", ") : "none"}`,
        questLine,
        `Status: ${paused ? "PAUSED" : "Playing"}`
    ].join(" | ");
}
