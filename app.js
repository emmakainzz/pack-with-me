const trips = [
  {
    name: 'NYC Weekend', detail: 'City streets & late nights', icon: '▥',
    groups: {
      Clothing: ['Striped tee', 'Wide-leg jeans', 'Black slip dress', 'Leather jacket'],
      'Shoes & accessories': ['White sneakers', 'Ankle boots', 'Canvas tote', 'Small black bag'],
      Essentials: ['Phone charger', 'Toiletry kit', 'ID & wallet']
    },
    looks: [
      ['Coffee & city walks', 'Striped tee, wide-leg jeans, white sneakers and a canvas tote.'],
      ['Dinner downtown', 'Black slip dress, leather jacket, ankle boots and a small black bag.']
    ]
  },
  {
    name: 'Montauk Getaway', detail: 'Salt air & sunset dinners', icon: '☼',
    groups: {
      Clothing: ['Swimsuit', 'Linen shirt', 'Sundress', 'Light cardigan'],
      'Shoes & accessories': ['Flip-flops', 'Flat sandals', 'Straw tote', 'Woven bag', 'Sunglasses'],
      Essentials: ['Sunscreen', 'Beach towel', 'Phone charger', 'Toiletry kit', 'ID & wallet']
    },
    looks: [
      ['Beach morning', 'Blue swimsuit, linen shirt, flip-flops and a straw tote.'],
      ['Sunset dinner', 'Ivory sundress, light cardigan, flat sandals and a woven bag.']
    ]
  },
  {
    name: 'College Visit', detail: 'Campus tours & dinner plans', icon: '◇',
    groups: {
      Clothing: ['Gray crewneck', 'Straight-leg jeans', 'Navy sweater', 'Tailored trousers'],
      'Shoes & accessories': ['Walking sneakers', 'Loafers', 'Backpack', 'Shoulder bag'],
      Essentials: ['Tour confirmation', 'Notebook & pen', 'Water bottle', 'Phone charger', 'Toiletry kit', 'ID & wallet']
    },
    looks: [
      ['Campus tour', 'Gray crewneck, straight-leg jeans, walking sneakers and a backpack.'],
      ['Dinner near campus', 'Navy sweater, tailored trousers, loafers and a small shoulder bag.']
    ]
  }
];

const storageKey = 'pack-with-me-v1';
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(storageKey)) ?? {};
} catch {
  // Packing still works if storage is unavailable.
}

const packed = trips.map((trip, index) => {
  const items = Object.values(trip.groups).flat();
  const previous = saved.packed?.[index];
  return new Set(Array.isArray(previous) ? previous.filter(item => items.includes(item)) : []);
});
let selected = Object.hasOwn(trips, saved.selected) && Number.isInteger(saved.selected) ? saved.selected : 0;

const tripButtons = document.querySelector('#trips');
const checklist = document.querySelector('#checklist');
const looks = document.querySelector('#looks');
const reset = document.querySelector('#reset');

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ selected, packed: packed.map(items => [...items]) }));
  } catch {
    // Keep the current session usable without storage.
  }
}

function updateProgress() {
  const total = Object.values(trips[selected].groups).flat().length;
  const count = packed[selected].size;
  document.querySelector('#count').textContent = `${count} of ${total} packed`;
  document.querySelector('#hint').textContent = count === total ? 'All packed. Bon voyage!' : 'Check off items as you pack.';
  document.querySelector('#fill').style.height = `${count / total * 100}%`;
}

function renderTrip() {
  const trip = trips[selected];
  [...tripButtons.children].forEach((button, index) => button.setAttribute('aria-pressed', index === selected));
  document.querySelector('#trip-name').textContent = trip.name;

  checklist.replaceChildren();
  for (const [group, items] of Object.entries(trip.groups)) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group;
    fieldset.append(legend);
    for (const item of items) {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = packed[selected].has(item);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) packed[selected].add(item);
        else packed[selected].delete(item);
        save();
        updateProgress();
      });
      const name = document.createElement('span');
      name.textContent = item;
      label.append(checkbox, name);
      fieldset.append(label);
    }
    checklist.append(fieldset);
  }

  looks.innerHTML = trip.looks.map(([title, description], index) => `
    <article class="look panel">
      <div class="look-photo" style="--photo-x:${index * 100}%; --photo-y:${selected * 50}%"></div>
      <div class="look-copy">
        <p class="look-time">${index === 0 ? '☼ &nbsp; Daytime' : '☾ &nbsp; Going out'}</p>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    </article>`).join('');
  updateProgress();
}

trips.forEach((trip, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<span class="trip-icon" aria-hidden="true">${trip.icon}</span><span><strong>${trip.name}</strong><small>${trip.detail}</small></span>`;
  button.addEventListener('click', () => {
    selected = index;
    save();
    renderTrip();
  });
  tripButtons.append(button);
});

reset.addEventListener('click', () => {
  packed[selected].clear();
  checklist.querySelectorAll('input').forEach(checkbox => { checkbox.checked = false; });
  save();
  updateProgress();
});

renderTrip();
