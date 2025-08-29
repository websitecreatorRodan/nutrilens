"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload an Image</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className="w-full h-64 border-2 border-dashed border-border rounded-md flex items-center justify-center bg-muted cursor-pointer"
            onClick={handleUploadClick}
          >
            {image ? (
              <div className="relative w-full h-full">
                <Image
                  src={image}
                  alt="Uploaded preview"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="mx-auto h-12 w-12" />
                <p>Click to upload an image</p>
              </div>
            )}
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <Button onClick={handleUploadClick} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Select Image
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
