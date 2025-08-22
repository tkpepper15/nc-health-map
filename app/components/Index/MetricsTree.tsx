'use client';

import React, { useState } from 'react';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  isExpandable?: boolean;
  dataLayer?: DataLayer;
  isActive?: boolean;
}

interface MetricsTreeProps {
  currentLayer: DataLayer;
  onLayerChange: (layer: DataLayer) => void;
}

export default function MetricsTree({ currentLayer, onLayerChange }: MetricsTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'healthcare-vulnerability']));

  const treeData: TreeNode = {
    id: 'root',
    label: 'METRICS',
    children: [
      {
        id: 'healthcare-vulnerability',
        label: 'Healthcare Vulnerability and Access',
        isExpandable: true,
        isActive: true,
        children: [
          {
            id: 'healthcare-access',
            label: 'Healthcare and Access Risks',
            isExpandable: true,
            children: [
              {
                id: 'hcvi',
                label: 'HCVI',
                dataLayer: 'medicaid'
              }
            ]
          },
          {
            id: 'healthcare-risk',
            label: 'Healthcare risk',
            isExpandable: true,
            children: [
              {
                id: 'medicaid-analysis',
                label: 'Medicaid Analysis',
                isExpandable: true,
                children: [
                  {
                    id: 'current-enrollment',
                    label: 'Current enrollment rates',
                    dataLayer: 'medicaid'
                  }
                ]
              },
              {
                id: 'social-vulnerability',
                label: 'Social Vulnerability',
                dataLayer: 'svi'
              },
              {
                id: 'hospital-infrastructure',
                label: 'Hospital Infrastructure',
                dataLayer: 'hospitals'
              }
            ]
          }
        ]
      }
    ]
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.dataLayer) {
      onLayerChange(node.dataLayer);
    } else if (node.isExpandable) {
      toggleNode(node.id);
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.dataLayer === currentLayer;
    const paddingLeft = depth * 12;

    return (
      <div key={node.id}>
        <div 
          className={`
            tree-node flex items-center cursor-pointer py-1 px-2 text-sm rounded
            ${isSelected ? 'active' : 'text-gray-700'}
            ${node.isActive ? 'font-medium' : ''}
          `}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {hasChildren && (
            <button
              className="mr-1 w-4 h-4 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          {!hasChildren && (
            <div className="mr-1 w-4 h-4" />
          )}
          
          <span className={depth === 0 ? 'text-xs font-semibold text-gray-500 uppercase tracking-wide' : ''}>
            {node.label}
          </span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="climate-card p-3 mb-4">
      {renderNode(treeData)}
    </div>
  );
}