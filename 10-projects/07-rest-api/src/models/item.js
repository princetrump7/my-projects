class Item {
  constructor({ id, name, description }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = new Date().toISOString();
  }
}

module.exports = { Item };
