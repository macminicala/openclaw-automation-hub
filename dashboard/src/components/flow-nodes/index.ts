import { TriggerNode } from "./trigger-node"
import { ActionNode } from "./action-node"

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

export type NodeType = "trigger" | "action"
