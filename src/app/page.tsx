
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Upload, Sparkles, Loader2, Leaf, PersonStanding, MapPin, Heart, Shield, Droplets, Scale, Soup, Bot, ShieldAlert, HeartCrack, Info, Camera, Video, VideoOff, CircleDot } from "lucide-react";
import Image from "next/image";
import { analyzeFoodImage, type AnalyzeFoodImageOutput } from "@/ai/flows/analyze-food-image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";


export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeFoodImageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);


  useEffect(() => {
    if (isCameraDialogOpen) {
      const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Camera API not supported in this browser');
             toast({
                variant: 'destructive',
                title: 'Camera Not Supported',
                description: 'Your browser does not support camera access.',
             });
            setHasCameraPermission(false);
            return;
        }

        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(mediaStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings to use this feature.",
          });
        }
      };
      getCameraPermission();
    } else {
        // Stop stream when dialog is closed
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraDialogOpen]);


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
            description: "Please upload or take an image to analyze.",
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

  const handleSnapPicture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            setImage(dataUri);
            setAnalysis(null);
            setIsCameraDialogOpen(false);
        } else {
             toast({
                title: "Capture Failed",
                description: "Could not capture an image.",
                variant: "destructive"
            });
        }
    }
  };

  const googleMapsUrl = analysis ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(analysis.availability.googleMapsQuery)}` : '';

  return (
    <>
    <main className="flex min-h-screen flex-col items-center gap-8 p-4 md:p-12 lg:p-24 bg-background">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">NutriLens</h1>
        <p className="text-muted-foreground mt-2">Upload or take a picture of food to learn more about it.</p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
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
                  data-ai-hint="food item"
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
          <div className="w-full flex flex-col sm:flex-row gap-2">
            <Button onClick={handleUploadClick} className="w-full" variant="outline">
                <Upload className="mr-2"/>
                Upload from Device
            </Button>
            <Button onClick={() => setIsCameraDialogOpen(true)} className="w-full" variant="outline">
                <Camera className="mr-2"/>
                Take a Picture
            </Button>
          </div>
          <Button onClick={handleAnalyzeClick} className="w-full" disabled={isLoading}>
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
                
                {analysis.isSpoiled && (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Spoilage Warning!</AlertTitle>
                        <AlertDescription>
                            {analysis.spoilageReason || "This food appears to be spoiled or rotten. It is not safe to eat."}
                        </AlertDescription>
                    </Alert>
                )}

                <Alert variant={analysis.isHealthy ? "default" : "destructive"} className={cn(analysis.isHealthy ? "bg-primary/10 border-primary/50" : "")}>
                    {analysis.isHealthy ? <Heart className="h-4 w-4" /> : <HeartCrack className="h-4 w-4" />}
                    <AlertTitle>Health Assessment: {analysis.isHealthy ? "Healthy" : "Not Healthy"}</AlertTitle>
                    <AlertDescription>
                        {analysis.healthSummary}
                    </AlertDescription>
                </Alert>
                
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Leaf className="text-primary"/>Nutrient Profile <span className="text-sm font-normal text-muted-foreground">(per 10g)</span></h3>
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
                                <h4 className="font-semibold">Heart Health</h4>
                                <p className="text-muted-foreground">{analysis.suitability.heartHealth}</p>
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
                            <Scale className="text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Weight Management</h4>
                                <p className="text-muted-foreground">{analysis.suitability.weightManagement}</p>                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <Soup className="text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Gut Health</h4>
                                <p className="text-muted-foreground">{analysis.suitability.gutHealth}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <Info className="text-primary mt-1 flex-shrink-0" />
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

    <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Take a Picture</DialogTitle>
            </DialogHeader>
            <div className="relative">
                {hasCameraPermission === null && (
                    <div className="h-96 flex items-center justify-center bg-muted rounded-md">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                
                <video ref={videoRef} className={cn("w-full aspect-video rounded-md bg-black", hasCameraPermission === false && "hidden")} autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {hasCameraPermission === false && (
                    <div className="h-96 flex flex-col items-center justify-center bg-muted rounded-md text-center p-4">
                         <VideoOff className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold">Camera Access Denied</h3>
                        <p className="text-muted-foreground text-sm">Please allow camera access in your browser settings to use this feature.</p>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSnapPicture} disabled={!hasCameraPermission}>
                    <CircleDot className="mr-2"/>Snap Picture
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
