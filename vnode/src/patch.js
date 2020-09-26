/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Johnny Wang
 *
 */
import { createElm, updateElm } from './create-element';
import { createVnodeAt } from './vnode';

function isDef(s) {
  return s !== undefined;
}

function isUndef(s) {
  return s === undefined;
}

function isVnode(el) {
  return el.__vnode__;
}

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.tagName === vnode2.tagName;
}

function createKeyToOldIdx(children, beginIdx, endIdx){
  const map = {};
  for (let i = beginIdx; i <= endIdx; ++i) {
    const ch = children[i];
    if (ch) {
      const key = ch.key;
      if (key !== undefined) {
        map[key] = i;
      }
    }
  }
  return map;
}

function setTextContent(el, text) {
  el.textContent = text;
}

function removeVnodes (
  parentElm,
  vnodes,
  startIdx,
  endIdx
) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    if (ch != null) {
      parentElm.removeChild(ch.el);
    }
  }
}

function addVnodes (
  parentElm,
  before,
  vnodes,
  startIdx,
  endIdx,
) {
  for (; startIdx <= endIdx; ++startIdx) {
    const childVnode = vnodes[startIdx];
    if (childVnode != null) {
      parentElm.insertBefore(createElm(childVnode), before);
    }
  }
}

function updateChildrens (
  parentElm,
  oldCh,
  newCh
) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let oldElmToMove;
  let before;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 取回在 patch 時被設成 null 的 oldVnode
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    // 不需移動 node 的狀況
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    // 需移動 node 的狀況
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode);
      parentElm.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode)
      parentElm.insertBefore(oldEndVnode.el, oldStartVnode.el)
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    // 已非單純節點前後移動時，嘗試使用 key 處理
    // 這裏主要需根據新的 ch 來判斷，故以 newStartVnode 來依序處理
    // 1. 以新 vnode.key 在 oldCh 中找尋
    // 2. 不存在，直接在舊 vnode 前插入新 vnode
    // 3. 存在，檢查 sel，不同處理同 2.，相同進行 patchNode 接 4.
    // 4. 將 oldCh 中的對應原位置設為 undefined
    } else {
      // 將開始複雜化的所有 vnode 具有的 key 轉為 index 序號
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }
      // 取得在舊 vnodes 中具有相同 key 的節點位置
      idxInOld = oldKeyToIdx[newStartVnode.key];
      if (isUndef(idxInOld)) { // New element
        parentElm.insertBefore(createElm(newStartVnode), oldStartVnode.el);
      } else {
        oldElmToMove = oldCh[idxInOld];
        if (sameVnode(oldElmToMove, newStartVnode)) { // Same element
          patchVnode(oldElmToMove, newStartVnode);
          oldCh[idxInOld] = undefined; // 刪除原位置 vnode，避免被重複查找
          parentElm.insertBefore(oldElmToMove.el, oldStartVnode.el)
        } else { // New element
          parentElm.insertBefore(createElm(newStartVnode), oldStartVnode.el);
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].el
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }
}

function patchVnode(oldVnode, vnode) {
  const el = vnode.el = oldVnode.el; // 將舊的 el 掛給新的 vnode
  const oldCh = oldVnode.childrens;
  const ch = vnode.childrens;
  if (oldVnode === vnode) return;
  updateElm(el, vnode, oldVnode);
  if (isUndef(vnode.text)) {
    if (isDef(oldCh) && isDef(ch) && oldCh !== ch) {
      updateChildrens(el, oldCh, ch);
    } else if (isDef(ch)) {
      if (isDef(oldVnode.text)) setTextContent(el, '');
      addVnodes(el, null, ch, 0, ch.length - 1);
    } else if (isDef(oldCh)) {
      removeVnodes(el, oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      setTextContent(el, '');
    }
  } else if (oldVnode.text !== vnode.text) {
    if (isDef(oldCh)) {
      removeVnodes(el, oldCh, 0, oldCh.length - 1);
    }
    setTextContent(el, vnode.text);
  }
}

export function patch(oldVnode, vnode) {
  let oEl, parent;

  if (!isVnode(oldVnode)) {
    oldVnode = createVnodeAt(oldVnode);
  }

  if (sameVnode(oldVnode, vnode)) {
    patchVnode(oldVnode, vnode);
  } else {
    oEl = oldVnode.el;
    parent = oEl.parentNode;

    const nEl = createElm(vnode); // attach real el to vnode

    // replace node in parent
    if (parent !== null) {
      parent.insertBefore(nEl, oEl);
      parent.removeChild(oEl);
      oldVnode = null;
    }
  }

  return vnode;
}
