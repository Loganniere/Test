namespace DungeonCrawler
{
    public class Item
    {
        public string Name { get; }
        public int AttackBonus { get; }

        public Item(string name, int attackBonus)
        {
            Name = name;
            AttackBonus = attackBonus;
        }

        public override string ToString() => $"{Name} (+{AttackBonus} ATK)";
    }
}
