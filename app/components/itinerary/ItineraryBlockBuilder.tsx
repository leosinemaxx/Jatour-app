"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Move, 
  Clock, 
  MapPin, 
  Hotel, 
  Car, 
  Utensils,
  Camera,
  Calendar,
  DollarSign,
  GripVertical,
  Check,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export interface ItineraryBlock {
  id: string;
  type: 'accommodation' | 'transportation' | 'restaurant' | 'destination' | 'custom' | 'activity';
  order: number;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  cost?: number;
  currency: string;
  blockData: any;
  // Foreign keys
  accommodationId?: string;
  transportationId?: string;
  destinationId?: string;
  restaurantId?: string;
}

interface BlockType {
  type: ItineraryBlock['type'];
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const blockTypes: BlockType[] = [
  {
    type: 'destination',
    label: 'Destination',
    icon: MapPin,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    type: 'accommodation',
    label: 'Hotel',
    icon: Hotel,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    type: 'transportation',
    label: 'Transport',
    icon: Car,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    type: 'restaurant',
    label: 'Restaurant',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    type: 'activity',
    label: 'Activity',
    icon: Camera,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  {
    type: 'custom',
    label: 'Custom',
    icon: Edit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
];

interface ItineraryBlockBuilderProps {
  dayId: string;
  dayTitle: string;
  date: string;
  blocks: ItineraryBlock[];
  onBlocksChange: (blocks: ItineraryBlock[]) => void;
  className?: string;
}

export default function ItineraryBlockBuilder({
  dayId,
  dayTitle,
  date,
  blocks,
  onBlocksChange,
  className
}: ItineraryBlockBuilderProps) {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [newBlockType, setNewBlockType] = useState<ItineraryBlock['type']>('destination');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [customTime, setCustomTime] = useState('');

  // Mock data for demonstration
  const mockDestinations = [
    { id: '1', name: 'Gunung Bromo', city: 'Probolinggo', type: 'mountain' },
    { id: '2', name: 'Pantai Klayar', city: 'Pacitan', type: 'beach' },
    { id: '3', name: 'Air Terjun Coban Rondo', city: 'Malang', type: 'waterfall' }
  ];

  const mockAccommodations = [
    { id: '1', name: 'Golden Tulip Resort', city: 'Batu', type: 'luxury' },
    { id: '2', name: 'Batu Backpacker Lodge', city: 'Batu', type: 'budget' }
  ];

  const mockRestaurants = [
    { id: '1', name: 'Warung Bu Yuli', city: 'Malang', type: 'traditional' },
    { id: '2', name: 'Kopiko Roastery', city: 'Batu', type: 'cafe' }
  ];

  const mockTransportations = [
    { id: '1', type: 'bus', provider: 'Putra Remaja', route: 'Surabaya-Malang', price: 45000 },
    { id: '2', type: 'train', provider: 'KAI', route: 'Malang-Batu', price: 25000 }
  ];

  const handleAddBlock = () => {
    const newBlock: ItineraryBlock = {
      id: `block-${Date.now()}`,
      type: newBlockType,
      order: blocks.length,
      title: `New ${blockTypes.find(bt => bt.type === newBlockType)?.label}`,
      currency: 'IDR',
      blockData: {}
    };

    // Set default time for new blocks
    if (customTime) {
      newBlock.startTime = customTime;
      newBlock.endTime = customTime;
      newBlock.duration = 120; // 2 hours default
    }

    onBlocksChange([...blocks, newBlock]);
    setShowAddBlock(false);
    setCustomTime('');
  };

  const handleRemoveBlock = (blockId: string) => {
    onBlocksChange(blocks.filter(block => block.id !== blockId));
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ItineraryBlock>) => {
    onBlocksChange(blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const handleReorderBlocks = (dragIndex: number, hoverIndex: number) => {
    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, draggedBlock);
    
    // Update order
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index
    }));
    
    onBlocksChange(reorderedBlocks);
  };

  const getBlockIcon = (type: ItineraryBlock['type']) => {
    const blockType = blockTypes.find(bt => bt.type === type);
    return blockType?.icon || Edit;
  };

  const getBlockColor = (type: ItineraryBlock['type']) => {
    const blockType = blockTypes.find(bt => bt.type === type);
    return blockType || blockTypes[0];
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time;
  };

  const formatCost = (cost?: number, currency = 'IDR') => {
    if (!cost) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(cost);
  };

  const calculateBlockDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Day Header */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5" />
              <div>
                <h3 className="font-bold text-lg">{dayTitle}</h3>
                <p className="text-blue-100 text-sm">{date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">
                {blocks.length} blocks
              </p>
              <p className="text-xs text-blue-200">
                Total: {formatCost(blocks.reduce((sum, block) => sum + (block.cost || 0), 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocks List */}
      <div className="space-y-3 min-h-[200px]">
        <AnimatePresence>
          {blocks.map((block, index) => {
            const BlockIcon = getBlockIcon(block.type);
            const blockColor = getBlockColor(block.type);
            const isDragged = draggedBlock === block.id;
            const isEditing = editingBlock === block.id;

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                draggable
                onDragStart={() => setDraggedBlock(block.id)}
                onDragEnd={() => setDraggedBlock(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedBlock && draggedBlock !== block.id) {
                    const dragIndex = blocks.findIndex(b => b.id === draggedBlock);
                    const hoverIndex = blocks.findIndex(b => b.id === block.id);
                    handleReorderBlocks(dragIndex, hoverIndex);
                  }
                }}
                className={`
                  ${blockColor.bgColor} ${blockColor.borderColor} border rounded-lg p-4 cursor-move
                  transition-all duration-200 hover:shadow-md
                  ${isDragged ? 'opacity-50 scale-95' : 'hover:scale-105'}
                `}
              >
                <div className="flex items-start space-x-3">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center space-y-1 mt-1">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">
                      {index + 1}
                    </span>
                  </div>

                  {/* Block Icon */}
                  <div className={`p-2 rounded-lg ${blockColor.bgColor} ${blockColor.borderColor} border`}>
                    <BlockIcon className={`h-4 w-4 ${blockColor.color}`} />
                  </div>

                  {/* Block Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={block.title}
                          onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                          placeholder="Block title"
                          className="font-semibold"
                        />
                        <Input
                          value={block.description || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            value={block.startTime || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { 
                              startTime: e.target.value,
                              endTime: e.target.value 
                            })}
                            placeholder="Start time"
                          />
                          <Input
                            type="number"
                            value={block.cost || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { cost: parseFloat(e.target.value) || 0 })}
                            placeholder="Cost"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => setEditingBlock(null)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingBlock(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {block.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingBlock(block.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveBlock(block.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {block.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {block.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            {block.startTime && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(block.startTime)}</span>
                              </div>
                            )}
                            {block.duration && (
                              <span>{Math.round(block.duration / 60)}h {block.duration % 60}m</span>
                            )}
                            {block.cost && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{formatCost(block.cost, block.currency)}</span>
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className={`text-xs ${blockColor.color} ${blockColor.bgColor} ${blockColor.borderColor}`}>
                            {blockTypes.find(bt => bt.type === block.type)?.label}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Block Section */}
        {showAddBlock ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Add New Block</h4>
                
                {/* Block Type Selection */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {blockTypes.map((blockType) => {
                    const Icon = blockType.icon;
                    return (
                      <Button
                        key={blockType.type}
                        variant={newBlockType === blockType.type ? "default" : "outline"}
                        onClick={() => setNewBlockType(blockType.type)}
                        className="justify-start"
                      >
                        <Icon className={`h-4 w-4 mr-2 ${newBlockType === blockType.type ? 'text-white' : blockType.color}`} />
                        {blockType.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Time Input */}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="Start time (optional)"
                    className="w-40"
                  />
                </div>

                {/* Add/Cancel Buttons */}
                <div className="flex space-x-2">
                  <Button onClick={handleAddBlock} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Block
                  </Button>
                  <Button
                    onClick={() => setShowAddBlock(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowAddBlock(true)}
            variant="outline"
            className="w-full border-dashed border-2 border-gray-300 h-20 text-gray-500 hover:text-gray-700 hover:border-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        )}
      </div>

      {/* Daily Summary */}
      {blocks.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total: {blocks.length} blocks
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCost(blocks.reduce((sum, block) => sum + (block.cost || 0), 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
