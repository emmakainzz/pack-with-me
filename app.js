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
const presetCount = trips.length;
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(storageKey)) ?? {};
} catch {
  // A blocked or unreadable store should not prevent packing.
}

for (const name of saved.customTrips ?? []) {
  trips.push({ name, detail: 'Your packing list', icon: '✦', groups: {} });
}

const packed = trips.map((trip, index) => {
  const items = Object.values(trip.groups).flat();
  const previous = saved.packed?.[index];
  return new Set(Array.isArray(previous) ? previous.filter(item => items.includes(item)) : []);
});
const added = trips.map((_, index) => saved.added?.[index] ?? []);
let selected = Number.isInteger(saved.selected) && trips[saved.selected] ? saved.selected : 0;

const tripButtons = document.querySelector('#trips');
const create = document.querySelector('#create-trip');
const checklist = document.querySelector('#checklist');
const looks = document.querySelector('#looks');
const progress = document.querySelector('.progress');
const suitcase = document.querySelector('.suitcase');
const reset = document.querySelector('#reset');
const addForm = document.querySelector('#add-form');
const itemInput = document.querySelector('#item-name');
const editor = document.querySelector('#editor');
const editorForm = document.querySelector('#editor-form');
const editorInput = document.querySelector('#editor-name');
let submitEdit;

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      selected,
      packed: packed.map(items => [...items]),
      customTrips: trips.slice(presetCount).map(trip => trip.name),
      added
    }));
  } catch {
    // Keep the current session usable without storage.
  }
}

function updateProgress(animate = false) {
  const trip = trips[selected];
  const total = Object.values(trip.groups).flat().length + added[selected].length;
  const count = packed[selected].size + added[selected].filter(item => item.checked).length;
  const ready = total > 0 && count === total;
  document.querySelector('#count').textContent = `${count} of ${total} packed`;
  document.querySelector('#hint').textContent = ready ? 'Ready to go!' : 'Check off items as you pack.';
  document.querySelector('#fill').style.height = total ? `${count / total * 100}%` : '0%';
  progress.classList.toggle('ready', ready);

  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    suitcase.getAnimations().forEach(animation => animation.cancel());
    suitcase.animate([
      { transform: 'rotate(0)' },
      { transform: 'translateY(-3px) rotate(-6deg)' },
      { transform: 'rotate(0)' }
    ], { duration: 320, easing: 'ease-out' });
  }
}

function openEditor(title, label, button, value, onSubmit) {
  editorInput.setCustomValidity('');
  document.querySelector('#editor-title').textContent = title;
  document.querySelector('#editor-label').textContent = label;
  document.querySelector('#editor-submit').textContent = button;
  editorInput.value = value;
  submitEdit = onSubmit;
  editor.showModal();
  editorInput.select();
}

function makeGroup(name) {
  const group = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = name;
  group.append(legend);
  return group;
}

function packingRow(name, checked, onChange) {
  const row = document.createElement('div');
  row.className = 'packing-row';
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  const text = document.createElement('span');
  text.textContent = name;
  checkbox.addEventListener('change', () => {
    onChange(checkbox.checked);
    save();
    updateProgress(checkbox.checked);
  });
  label.append(checkbox, text);
  row.append(label);
  return { row, text };
}

function actionButton(text, itemName, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.setAttribute('aria-label', `${text} ${itemName}`);
  button.addEventListener('click', action);
  return button;
}

function renderChecklist() {
  const tripItems = added[selected];
  const tripPacked = packed[selected];
  checklist.replaceChildren();

  for (const [name, items] of Object.entries(trips[selected].groups)) {
    const group = makeGroup(name);
    for (const item of items) {
      const { row } = packingRow(item, tripPacked.has(item), checked => {
        if (checked) tripPacked.add(item);
        else tripPacked.delete(item);
      });
      group.append(row);
    }
    checklist.append(group);
  }

  if (tripItems.length) {
    const group = makeGroup('My items');
    for (const item of tripItems) {
      const { row, text } = packingRow(item.name, item.checked, checked => { item.checked = checked; });
      const actions = document.createElement('div');
      actions.className = 'item-actions';
      const edit = actionButton('Edit', item.name, () => {
        openEditor('Edit item', 'Item name', 'Save item', item.name, name => {
          item.name = name;
          text.textContent = name;
          edit.setAttribute('aria-label', `Edit ${name}`);
          remove.setAttribute('aria-label', `Remove ${name}`);
          save();
        });
      });
      const remove = actionButton('Remove', item.name, () => {
        tripItems.splice(tripItems.indexOf(item), 1);
        row.remove();
        if (!tripItems.length) group.remove();
        save();
        updateProgress();
        itemInput.focus();
      });
      actions.append(edit, remove);
      row.append(actions);
      group.append(row);
    }
    checklist.append(group);
  }

  document.querySelector('#empty-list').hidden = selected < presetCount || tripItems.length > 0;
}

function renderTrip() {
  const trip = trips[selected];
  tripButtons.querySelectorAll('.destination-card').forEach((button, index) => {
    button.setAttribute('aria-pressed', index === selected);
  });
  document.querySelector('#trip-name').textContent = trip.name;
  renderChecklist();
  document.querySelector('.outfits').hidden = !trip.looks;
  looks.innerHTML = (trip.looks ?? []).map(([title, description], index) => `
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

function addTripCard(trip, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'destination-card';
  button.dataset.theme = ['city', 'coast', 'campus'][index] ?? 'custom';
  button.innerHTML = '<span class="trip-icon" aria-hidden="true"></span><strong></strong><small></small>';
  button.querySelector('.trip-icon').textContent = trip.icon;
  button.querySelector('strong').textContent = trip.name;
  button.querySelector('small').textContent = trip.detail;
  button.addEventListener('click', () => {
    if (selected === index) return;
    selected = index;
    addForm.reset();
    save();
    renderTrip();
  });
  const nextCard = index < presetCount ? create : null;
  tripButtons.insertBefore(button, nextCard);
  return button;
}

editorForm.addEventListener('submit', event => {
  event.preventDefault();
  const value = editorInput.value.trim();
  if (!value) {
    editorInput.setCustomValidity('Enter a name.');
    editorInput.reportValidity();
    return;
  }
  editor.close();
  submitEdit(value);
});
editorInput.addEventListener('input', () => editorInput.setCustomValidity(''));
document.querySelector('#editor-cancel').addEventListener('click', () => editor.close());

create.addEventListener('click', () => {
  openEditor('Create My Own Trip', 'Trip name', 'Create trip', '', name => {
    const trip = { name, detail: 'Your packing list', icon: '✦', groups: {} };
    selected = trips.length;
    trips.push(trip);
    packed.push(new Set());
    added.push([]);
    const card = addTripCard(trip, selected);
    addForm.reset();
    save();
    renderTrip();
    card.focus();
  });
});

addForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = itemInput.value.trim();
  if (!name) {
    itemInput.focus();
    return;
  }
  added[selected].push({ name, checked: false });
  addForm.reset();
  save();
  renderChecklist();
  updateProgress();
  itemInput.focus();
});

reset.addEventListener('click', () => {
  packed[selected].clear();
  added[selected].forEach(item => { item.checked = false; });
  checklist.querySelectorAll('input').forEach(checkbox => { checkbox.checked = false; });
  save();
  updateProgress();
});

trips.forEach(addTripCard);
renderTrip();
