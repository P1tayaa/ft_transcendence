
import inputKeys from "../control.js"
import PlayerSide from "../pongLogic/setting.js"
import Mode from "../pongLogic/setting.js"



export function updateStateLoading(init, socket) {

  const NETWORK_MESSAGE = (init, socket) =>
    `Loading: ${init.assetsLoaded} / ${init.totalAssets}, socket connected == ${socket.Connected}, all Player ready == ${socket.allPlayerReady}`;

  const LOCAL_MESSAGE = (init) =>
    `Loading: ${init.assetsLoaded} / ${init.totalAssets}`;
  if (socket) {
    return NETWORK_MESSAGE(init, socket);
  }
  return LOCAL_MESSAGE(init);
}


function playerSideToString(sides) {
  const SINGLE_SIDE_MESSAGE = (side) =>
    `You are ${PlayerSide[side]} and use: [${inputKeys[side].up}] and[${inputKeys[side].down}]`;

  const MULTIPLE_SIDE_MESSAGE = (side) =>
    `This is player ${PlayerSide[side]} and use: [${inputKeys[side].up}] and[${inputKeys[side].down}]`;

  if (sides.length === 1) {
    return SINGLE_SIDE_MESSAGE(sides[0]);
  }

  return sides.map((side) => MULTIPLE_SIDE_MESSAGE(side)).join("\n");
}


export function showLoadingScreen(
  loadingMessage = "Loading assets...",
) {

  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-screen';
  loadingDiv.style.position = 'fixed';
  loadingDiv.style.top = '0';
  loadingDiv.style.left = '0';
  loadingDiv.style.width = '100%';
  loadingDiv.style.height = '100%';
  loadingDiv.style.display = 'flex';
  loadingDiv.style.flexDirection = 'column';
  loadingDiv.style.justifyContent = 'center';
  loadingDiv.style.alignItems = 'center';
  loadingDiv.style.backgroundColor = '#000';
  loadingDiv.style.color = '#fff';
  loadingDiv.style.fontSize = '2em';

  const loadingMessageElem = document.createElement('p');
  loadingMessageElem.id = 'loading-message';
  loadingMessageElem.innerText = loadingMessage;

  const controlInfoElem = document.createElement('p');
  controlInfoElem.id = 'control-info';
  controlInfoElem.innerText = "";

  loadingDiv.appendChild(loadingMessageElem);
  loadingDiv.appendChild(controlInfoElem);
  document.body.appendChild(loadingDiv);
}


export function updateControlInfo(sides) {
  const controlInfoElem = document.getElementById('control-info');
  if (controlInfoElem) {
    const controlInfo = playerSideToString(sides);
    controlInfoElem.innerText = controlInfo;
  }
}

export function updateLoadingMessage(newMessage) {
  const loadingMessageElem = document.getElementById('loading-message');
  if (loadingMessageElem) {
    loadingMessageElem.innerText = newMessage;
  }
}

export function hideLoadingScreen() {
  const loadingDiv = document.getElementById('loading-screen');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

export async function updateLoadingScreen(init, sides, shouldContinue, socket) {
  while (shouldContinue) {
    updateLoadingMessage(updateStateLoading(init, socket));
    if (sides != null) {
      updateControlInfo(sides);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}


