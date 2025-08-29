"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Sparkles, Loader2, Leaf, PersonStanding, MapPin, Heart, Shield, Droplets } from "lucide-react";
import Image from "next/image";
import { analyzeFoodImage, type AnalyzeFoodImageOutput } from "@/ai/flows/analyze-food-image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeFoodImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAnalysis(null);
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

  const handleAnalyzeClick = async () => {
    if (!image) {
        toast({
            title: "No Image Selected",
            description: "Please upload an image to analyze.",
            variant: "destructive"
        });
        return;
    }
    
    setIsLoading(true);
    setAnalysis(null);

    try {
        const result = await analyzeFoodImage({ photoDataUri: image });
        setAnalysis(result);
    } catch (error) {
        console.error("Analysis failed:", error);
        toast({
            title: "Analysis Failed",
            description: "Something went wrong while analyzing the image. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  const googleMapsUrl = analysis ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(analysis.availability.googleMapsQuery)}` : '';

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-4 md:p-12 lg:p-24 bg-background">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">NutriLens</h1>
        <p className="text-muted-foreground mt-2">Upload an image of food to learn more about it.</p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Food Image</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className="w-full h-64 border-2 border-dashed border-border rounded-md flex items-center justify-center bg-muted/50 cursor-pointer hover:border-primary transition-colors"
            onClick={handleUploadClick}
          >
            {image ? (
              <div className="relative w-full h-full">
                <Image
                  src={image}
                  alt="Uploaded preview"
                  fill
                  className="object-contain rounded-md"
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
          <Button onClick={handleAnalyzeClick} className="w-full" disabled={!image || isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze Image
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Analyzing... please wait.</p>
        </div>
      )}

      {analysis && (
        <Card className="w-full max-w-2xl animate-in fade-in-50">
            <CardHeader>
                <CardTitle>{analysis.foodName}</CardTitle>
                <CardDescription>Here's the detailed analysis of the food item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Leaf className="text-primary"/>Nutrient Profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                        {analysis.nutrients.map(nutrient => (
                            <div key={nutrient.name}>
                                <span className="font-semibold">{nutrient.name}:</span>
                                <span className="text-muted-foreground ml-2">{nutrient.amount}</span>
                                <p className="text-xs text-muted-foreground/80 italic"> - {nutrient.importance}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                 <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><PersonStanding className="text-primary"/>Dietary Suitability</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex gap-4 items-start">
                            <Droplets className="text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Diabetes</h4>
                                <p className="text-muted-foreground">{analysis.suitability.diabetes}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <Heart className="text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Cholesterol</h4>
                                <p className="text-muted-foreground">{analysis.suitability.cholesterol}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <Shield className="text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Allergies</h4>
                                <p className="text-muted-foreground">{analysis.suitability.allergies}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <PersonStanding className="text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">General</h4>
                                <p className="text-muted-foreground">{analysis.suitability.general}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <Separator />

                 <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><MapPin className="text-primary"/>Availability</h3>
                    <p className="text-sm text-muted-foreground">{analysis.availability.description}</p>
                    <Button asChild variant="link" className="p-0 h-auto mt-1">
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">Find near you on Google Maps</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </main>
  );
}
