using System;

namespace DungeonCrawler
{
    public class Monster
    {
        public string Name { get; }
        public int Health { get; private set; }
        public int Attack { get; }

        public Monster(string name, int health, int attack)
        {
            Name = name;
            Health = health;
            Attack = attack;
        }

        public bool IsAlive => Health > 0;

        public void TakeDamage(int amount)
        {
            Health = Math.Max(0, Health - amount);
        }
    }
}
