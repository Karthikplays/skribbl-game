const categories = {
  sports: [
    'cricket', 'football', 'tennis', 'basketball', 'swimming',
    'volleyball', 'badminton', 'hockey', 'cycling', 'archery',
    'boxing', 'wrestling', 'gymnastics', 'skateboarding', 'surfing',
    'baseball', 'golf', 'rugby', 'marathon', 'fencing',
    'weightlifting', 'judo', 'karate', 'snowboarding', 'rowing'
  ],

  movies: [
    'avatar', 'titanic', 'inception', 'interstellar', 'joker',
    'parasite', 'gravity', 'frozen', 'coco', 'brave',
    'moana', 'shrek', 'matrix', 'gladiator', 'jaws',
    'alien', 'psycho', 'casablanca', 'spotlight', 'whiplash',
    'dune', 'arrival', 'hereditary', 'nomadland', 'oppenheimer'
  ],

  games: [
    'minecraft', 'fortnite', 'chess', 'ludo', 'pokemon',
    'zelda', 'mario', 'tetris', 'pacman', 'halo',
    'overwatch', 'valorant', 'roblox', 'doom', 'portal',
    'skyrim', 'celeste', 'undertale', 'stardew', 'among us',
    'gta', 'sims', 'cyberpunk', 'hollow knight', 'cuphead'
  ],

  animals: [
    'elephant', 'giraffe', 'penguin', 'dolphin', 'cheetah',
    'kangaroo', 'octopus', 'flamingo', 'platypus', 'pangolin',
    'axolotl', 'chameleon', 'narwhal', 'wolverine', 'meerkat',
    'capybara', 'sloth', 'mantis', 'jaguar', 'porcupine',
    'pelican', 'albatross', 'hornbill', 'tapir', 'binturong'
  ],

  food: [
    'pizza', 'sushi', 'biryani', 'burger', 'pasta',
    'tacos', 'ramen', 'dosa', 'croissant', 'paella',
    'lasagna', 'hummus', 'falafel', 'tiramisu', 'churros',
    'kimchi', 'pho', 'gyoza', 'baklava', 'pretzel',
    'moussaka', 'ceviche', 'risotto', 'samosa', 'waffles'
  ]
};

function getWord(category) {
  const list = categories[category] || categories.sports;
  return list[Math.floor(Math.random() * list.length)];
}

function getCategories() {
  return Object.keys(categories);
}

function getWordCount(category) {
  return (categories[category] || []).length;
}

module.exports = { categories, getWord, getCategories, getWordCount };