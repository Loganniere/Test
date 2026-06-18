using System;
using System.Collections.Generic;

namespace DungeonCrawler
{
    public class Room
    {
        public List<Item> Loot { get; } = new();
        public Monster? Monster { get; set; }

        private static readonly Random Rand = new();
        private static readonly string[] ItemNames = { "Sword", "Axe", "Dagger", "Spear" };
        private static readonly string[] MonsterNames = { "Goblin", "Skeleton", "Orc" };

        public static Room Generate()
        {
            var room = new Room();
            if (Rand.NextDouble() < 0.7)
            {
                string name = MonsterNames[Rand.Next(MonsterNames.Length)];
                room.Monster = new Monster(name, Rand.Next(8, 15), Rand.Next(2, 6));
            }
            if (Rand.NextDouble() < 0.6)
            {
                string itemName = ItemNames[Rand.Next(ItemNames.Length)];
                room.Loot.Add(new Item(itemName, Rand.Next(1, 5)));
            }
            return room;
        }
    }
}
