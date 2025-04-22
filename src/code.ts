// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This plugin creates rectangles on the screen.
// const numberOfRectangles = 5;

// const nodes: SceneNode[] = [];
// for (let i = 0; i < numberOfRectangles; i++) {
//   const rect = figma.createRectangle();
//   rect.x = i * 150;
//   rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
//   figma.currentPage.appendChild(rect);
//   nodes.push(rect);
// }
// figma.currentPage.selection = nodes;
// figma.viewport.scrollAndZoomIntoView(nodes);

function detachInstanceSafe(instance: InstanceNode): SceneNode {
  const { x, y, name, parent } = instance;
  const detached = instance.detachInstance();
  detached.x = x;
  detached.y = y;
  // detached.name = `${name} (detached)`;
  if (parent) parent.appendChild(detached);
  return detached;
}

function uncomponentComponent(component: ComponentNode): SceneNode {
  const { x, y, name, parent } = component;
  const tempInstance = component.createInstance();
  figma.currentPage.appendChild(tempInstance);
  const detached = tempInstance.detachInstance();
  detached.x = x;
  detached.y = y;
  // detached.name = `${name} (detached)`;
  if (parent) parent.appendChild(detached);
  component.remove();
  return detached;
}

function uncomponentComponentSet(set: ComponentSetNode): SceneNode[] {
  const results: SceneNode[] = [];
  for (const variant of set.children) {
    if (variant.type === "COMPONENT") {
      const { x, y, name } = variant;
      const tempInstance = variant.createInstance();
      figma.currentPage.appendChild(tempInstance);
      const detached = tempInstance.detachInstance();
      detached.x = x;
      detached.y = y;
      // detached.name = `${name} (detached)`;
      results.push(detached);
    }
  }
  // Optional: remove the variant set from the page
  set.remove();
  return results;
}

// --- Main logic ---
const selection = figma.currentPage.selection;
const newSelection: SceneNode[] = [];

if (selection.length === 0) {
  figma.notify("Select one or more components, instances, or variants.");
} else {
  for (const node of selection) {
    if (node.type === "INSTANCE") {
      const detached = detachInstanceSafe(node);
      newSelection.push(detached);
    } else if (node.type === "COMPONENT") {
      const detached = uncomponentComponent(node);
      newSelection.push(detached);
    } else if (node.type === "COMPONENT_SET") {
      const detachedVariants = uncomponentComponentSet(node);
      newSelection.push(...detachedVariants);
    } else {
      figma.notify(`Skipped: ${node.name} is not a component, instance, or variant.`);
    }
  }
}

if (newSelection.length > 0) {
  figma.currentPage.selection = newSelection;
  figma.viewport.scrollAndZoomIntoView(newSelection);
}


// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
figma.closePlugin();
