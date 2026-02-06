"use client"

import { type NodeProps } from "@xyflow/react"
import { BaseNode, type BaseNodeData } from "./base-node"

export function TriggerNode(props: NodeProps & { data: BaseNodeData }) {
  return <BaseNode {...props} nodeType="trigger" />
}
