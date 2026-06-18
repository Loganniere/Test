using System;
using System.Collections.Generic;

namespace DungeonCrawler
{
    public class Player
    {
        public int Health { get; private set; } = 30;
        public int BaseAttack { get; } = 5;
        public List<Item> Inventory { get; } = new();

        public bool IsAlive => Health > 0;

        public int AttackPower => BaseAttack + GetAttackBonus();

        private int GetAttackBonus()
        {
            int bonus = 0;
            foreach (var item in Inventory)
                bonus += item.AttackBonus;
            return bonus;
        }

        public void TakeDamage(int amount)
        {
            Health = Math.Max(0, Health - amount);
        }

        public void AddItem(Item item)
        {
            Inventory.Add(item);
            Console.WriteLine($"You picked up: {item}");
        }
    }
}
