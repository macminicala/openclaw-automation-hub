"use client"

import { type NodeProps } from "@xyflow/react"
import { BaseNode, type BaseNodeData } from "./base-node"

export function ActionNode(props: NodeProps & { data: BaseNodeData }) {
  return <BaseNode {...props} nodeType="action" />
}
