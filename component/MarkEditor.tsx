import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Trash2, X, Save, Type, Clock } from "lucide-react";
import Button from "./Button";

export interface Marker {
  _id: string;
  timestamp: number;
  content: string;
  type: string;
  data?: {
    title?: string;
    description?: string;
    fontSize?: string;
    textColor?: string;
    backgroundColor?: string;
  };
}

interface MarkerEditorProps {
  marker: Marker;
  onUpdate: (id: string, updates: Partial<Marker>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const MarkerEditor: React.FC<MarkerEditorProps> = ({
  marker,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [content, setContent] = useState(marker.content);
  const [type, setType] = useState(marker.type);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setContent(marker.content);
    setType(marker.type);
  }, [marker]);

  const handleSave = () => {
    onUpdate(marker._id, {
      content,
      type,
      timestamp: marker.timestamp,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(marker._id);
  };

  return (
    <Card className="h-full bg-white/90 backdrop-blur-sm border-none shadow-xl rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-violet-100 to-pink-100 rounded-t-2xl">
        <CardTitle className="bg-gradient-to-r from-violet-600 to-pink-600 text-transparent bg-clip-text">
          ✨ Edit Interaction Point
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/50 rounded-full"
        >
          <X size={20} />
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-10">
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 p-4 rounded-xl mb-8">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock size={16} className="text-violet-500" />
              Timestamp
            </label>
            <p className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-pink-600 text-transparent bg-clip-text">
              {(marker.timestamp || 0).toFixed(2)} seconds
            </p>
          </div>
           <div>
            <label className="flex mt-4 items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Type size={16} className="text-violet-500" />
              Content Type
            </label>
            <select
              className="w-full p-3 text-gray-700 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm
                         focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="text">Text</option>
              <option value="question">Question</option>
              <option value="feedback">Feedback</option>
              <option value="prompt">Prompt</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              className="w-full p-4 border text-gray-700   border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm
                         focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all
                         min-h-[120px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your interaction content..."
            />
          </div>

          <div className="flex justify-end pt-4 gap-4">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 
                bg-gray-100 hover:bg-gray-200
                text-gray-700
                border border-gray-300
                rounded-md text-sm
                min-w-[90px]"
            >
              <Trash2 size={14} />
              Delete
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 
              bg-gray-100 hover:bg-gray-200
              text-gray-700
              border border-gray-300
              rounded-md text-sm
              min-w-[90px]"
          >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
//done
export default MarkerEditor;
