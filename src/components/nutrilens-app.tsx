"use client";

import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FOOD_DATABASE, DEFAULT_PROFILES } from '@/lib/constants';
import type { DietaryProfile, FoodItem, MealItem, SavedMeal, NutritionalInfo } from '@/lib/types';
import { getDietaryRecommendations, type DietaryRecommendationsOutput } from '@/ai/flows/personalized-dietary-recommendations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast"
import { NutriLensLogo } from '@/components/icons';
import { AlertCircle, CheckCircle, ChefHat, Heart, Loader2, Plus, Save, Sparkles, Trash2, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

export function NutriLensApp() {
  const { toast } = useToast();

  const [foodData, setFoodData] = useLocalStorage<FoodItem[]>('nutrilens-food-data', FOOD_DATABASE);
  const [profiles, setProfiles] = useLocalStorage<DietaryProfile[]>('nutrilens-profiles', DEFAULT_PROFILES);
  
  const [currentMeal, setCurrentMeal] = useState<MealItem[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [quantity, setQuantity] = useState('100');
  
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || 'guest');
  
  const [recommendations, setRecommendations] = useState<DietaryRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isProfileManagerOpen, setProfileManagerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<DietaryProfile> | null>(null);

  const selectedProfile = useMemo(() => profiles.find(p => p.id === selectedProfileId), [profiles, selectedProfileId]);

  const totalNutrition = useMemo(() => {
    return currentMeal.reduce((acc, item) => {
      const nutrition = item.foodItem.nutrition;
      const factor = item.quantity / 100; // Assuming nutrition is per 100g
      acc.calories += nutrition.calories * factor;
      acc.protein += nutrition.protein * factor;
      acc.carbs += nutrition.carbs * factor;
      acc.fat += nutrition.fat * factor;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [currentMeal]);

  const handleAddFood = () => {
    const food = foodData.find(f => f.id === selectedFoodId);
    const q = parseInt(quantity, 10);
    if (food && q > 0) {
      const existingItemIndex = currentMeal.findIndex(item => item.foodItem.id === food.id);
      if (existingItemIndex > -1) {
        const updatedMeal = [...currentMeal];
        updatedMeal[existingItemIndex].quantity += q;
        setCurrentMeal(updatedMeal);
      } else {
        setCurrentMeal([...currentMeal, { foodItem: food, quantity: q }]);
      }
      toast({ title: "Food Added", description: `${food.name} was added to your meal.` });
    } else {
      toast({ title: "Error", description: "Please select a food and enter a valid quantity.", variant: "destructive" });
    }
  };

  const handleRemoveFood = (foodId: string) => {
    setCurrentMeal(currentMeal.filter(item => item.foodItem.id !== foodId));
    toast({ title: "Food Removed", description: `An item was removed from your meal.` });
  };
  
  const handleGetRecommendations = async () => {
    if (!selectedProfile || currentMeal.length === 0) {
      toast({ title: "Cannot get recommendations", description: "Please add food to your meal and select a dietary profile.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    setRecommendations(null);

    try {
      const input = {
        dietaryProfile: {
          dietaryNeeds: selectedProfile.dietaryNeeds,
          allergies: selectedProfile.allergies,
          preferences: selectedProfile.preferences || '',
        },
        foodItems: currentMeal.map(item => ({
          name: item.foodItem.name,
          ingredients: item.foodItem.ingredients,
        })),
      };
      const result = await getDietaryRecommendations(input);
      setRecommendations(result);
    } catch (error) {
      console.error(error);
      toast({ title: "AI Error", description: "Failed to get recommendations.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = () => {
    if (!editingProfile || !editingProfile.name) {
      toast({ title: "Error", description: "Profile name is required.", variant: "destructive" });
      return;
    }
    const profileData = {
      ...editingProfile,
      dietaryNeeds: editingProfile.dietaryNeeds || 'None',
      allergies: editingProfile.allergies || 'None',
    } as DietaryProfile;

    if (profileData.id) {
      setProfiles(profiles.map(p => p.id === profileData.id ? profileData : p));
      toast({ title: "Profile Updated", description: `Profile "${profileData.name}" has been updated.` });
    } else {
      const newProfile = { ...profileData, id: new Date().toISOString() };
      setProfiles([...profiles, newProfile]);
      setSelectedProfileId(newProfile.id);
      toast({ title: "Profile Created", description: `Profile "${newProfile.name}" has been created.` });
    }
    setEditingProfile(null);
    setProfileManagerOpen(false);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (DEFAULT_PROFILES.some(p => p.id === profileId)) {
      toast({ title: "Error", description: "Cannot delete default profiles.", variant: "destructive" });
      return;
    }
    setProfiles(profiles.filter(p => p.id !== profileId));
    if (selectedProfileId === profileId) {
      setSelectedProfileId(profiles[0]?.id || 'guest');
    }
    toast({ title: "Profile Deleted", description: `A profile has been deleted.` });
    setEditingProfile(null);
    setProfileManagerOpen(false);
  };

  useEffect(() => {
    if(!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [profiles, selectedProfileId]);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <NutriLensLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">NutriLens</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setProfileManagerOpen(true)}>Manage Profiles</Button>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ChefHat className="text-primary"/>1. Build Your Meal</CardTitle>
                <CardDescription>Add food items to create your meal.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-end gap-2">
                  <div className="grid w-full sm:flex-1 gap-1.5">
                    <Label htmlFor="food-select">Food Item</Label>
                    <Select value={selectedFoodId} onValueChange={setSelectedFoodId}>
                      <SelectTrigger id="food-select"><SelectValue placeholder="Select a food" /></SelectTrigger>
                      <SelectContent>
                        {foodData.map(food => <SelectItem key={food.id} value={food.id}>{food.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full sm:w-32 gap-1.5">
                    <Label htmlFor="quantity">Quantity (g)</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
                  </div>
                  <Button onClick={handleAddFood} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/>Add</Button>
                </div>
                
                <Separator/>

                <div className="space-y-2">
                  <h3 className="font-semibold">Current Meal</h3>
                  <div className="rounded-md border max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Food</TableHead>
                          <TableHead className="text-right">Quantity (g)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentMeal.length > 0 ? currentMeal.map(item => (
                          <TableRow key={item.foodItem.id} className="animate-in fade-in">
                            <TableCell>{item.foodItem.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveFood(item.foodItem.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Your meal is empty.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card className="w-full bg-secondary">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Nutrition Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div><p className="font-bold text-xl text-primary">{Math.round(totalNutrition.calories)}</p><p className="text-sm text-muted-foreground">Calories</p></div>
                        <div><p className="font-bold text-xl">{Math.round(totalNutrition.protein)}g</p><p className="text-sm text-muted-foreground">Protein</p></div>
                        <div><p className="font-bold text-xl">{Math.round(totalNutrition.carbs)}g</p><p className="text-sm text-muted-foreground">Carbs</p></div>
                        <div><p className="font-bold text-xl">{Math.round(totalNutrition.fat)}g</p><p className="text-sm text-muted-foreground">Fat</p></div>
                    </div>
                </CardContent>
            </Card>
          
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Heart className="text-primary"/>2. Get Dietary Analysis</CardTitle>
                <CardDescription>Select a profile and get AI-powered recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="profile-select">Dietary Profile</Label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger id="profile-select"><SelectValue placeholder="Select a profile" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGetRecommendations} disabled={isLoading || currentMeal.length === 0}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Get Recommendations
                </Button>
              </CardContent>
              { (isLoading || recommendations) &&
                <CardContent>
                    <Separator className="mb-4" />
                    <div className="space-y-4">
                    {isLoading && (
                      <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="font-semibold">Analyzing your meal...</p>
                        <p className="text-sm">Our AI is checking ingredients against your profile.</p>
                      </div>
                    )}
                    {recommendations && (
                      <div className="space-y-4 animate-in fade-in-50">
                        <h3 className="text-lg font-semibold">Analysis Complete for <span className="text-primary">{selectedProfile?.name}</span></h3>
                        {recommendations.map((rec, index) => (
                          <Card key={index} className={cn(
                            "transition-all",
                            rec.isSuitable ? "border-green-500/50" : "border-red-500/50"
                          )}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base">{rec.foodItemName}</CardTitle>
                                {rec.isSuitable ? 
                                  <CheckCircle className="h-6 w-6 text-green-500" /> : 
                                  <AlertCircle className="h-6 w-6 text-red-500" />
                                }
                            </CardHeader>
                            <CardContent>
                                <p className={cn("text-sm", rec.isSuitable ? "text-muted-foreground" : "text-red-600 dark:text-red-400 font-medium")}>{rec.reason || "This item looks suitable for your profile."}</p>
                                <p className="text-xs text-muted-foreground mt-2">{rec.recommendation}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    </div>
                </CardContent>
              }
            </Card>
        </div>
      </main>

      {/* Profile Manager Dialog */}
      <Dialog open={isProfileManagerOpen} onOpenChange={setProfileManagerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Manage Profiles'}</DialogTitle>
            <DialogDescription>
              {editingProfile ? 'Update the details for this profile.' : 'Select a profile to edit or create a new one.'}
            </DialogDescription>
          </DialogHeader>
          {editingProfile ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="name">Profile Name</Label><Input id="name" value={editingProfile.name || ''} onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})} /></div>
              <div className="grid gap-2"><Label htmlFor="needs">Dietary Needs</Label><Textarea id="needs" placeholder="e.g., Low-carb, vegan, high-protein" value={editingProfile.dietaryNeeds || ''} onChange={(e) => setEditingProfile({...editingProfile, dietaryNeeds: e.target.value})} /></div>
              <div className="grid gap-2"><Label htmlFor="allergies">Allergies</Label><Textarea id="allergies" placeholder="e.g., Peanuts, gluten, dairy" value={editingProfile.allergies || ''} onChange={(e) => setEditingProfile({...editingProfile, allergies: e.target.value})} /></div>
              <div className="grid gap-2"><Label htmlFor="preferences">Preferences</Label><Textarea id="preferences" placeholder="e.g., Avoid processed foods" value={editingProfile.preferences || ''} onChange={(e) => setEditingProfile({...editingProfile, preferences: e.target.value})} /></div>
            </div>
          ) : (
            <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                  <span>{p.name}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setEditingProfile({...p})}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(p.id)} disabled={DEFAULT_PROFILES.some(dp => dp.id === p.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            {editingProfile ? (
              <>
                <Button variant="ghost" onClick={() => setEditingProfile(null)}>Back</Button>
                <Button onClick={handleSaveProfile}>Save Profile</Button>
              </>
            ) : (
              <Button onClick={() => setEditingProfile({})}><UserPlus className="mr-2 h-4 w-4"/>Create New Profile</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
