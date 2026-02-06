import { TriggerNode } from "./trigger-node"
import { ActionNode } from "./action-node"

export { TriggerNode } from "./trigger-node"
export { ActionNode } from "./action-node"
export { BaseNode, type BaseNodeData } from "./base-node"

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

export type NodeType = "trigger" | "action"
