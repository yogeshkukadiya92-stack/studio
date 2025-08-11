"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  AlertCircle,
  ChefHat,
  LoaderCircle,
  ShoppingBasket,
  Utensils,
} from "lucide-react";

import { suggestRecipe, type SuggestRecipeOutput } from "@/ai/flows/suggest-recipe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analytics } from "@/lib/firebase";

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: "Please enter at least one ingredient.",
  }),
});

export default function Home() {
  const [recipe, setRecipe] = useState<SuggestRecipeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analytics) {
      // You can log events here
      console.log("Firebase Analytics is initialized.");
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecipe(null);
    setError(null);
    try {
      const result = await suggestRecipe({ ingredients: values.ingredients });
      setRecipe(result);
    } catch (e) {
      setError(
        "Sorry, I couldn't come up with a recipe. Please try again with different ingredients."
      );
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
        <header className="mb-12">
          <h1 className="font-headline text-5xl font-bold text-primary flex items-center justify-center gap-4">
            <ChefHat className="h-12 w-12" />
            Coach for Life Recipe Maker
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            What&apos;s in your fridge? Let&apos;s cook something delicious!
          </p>
        </header>

        <Card className="w-full shadow-lg text-left">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              Your Ingredients
            </CardTitle>
            <CardDescription>
              Enter the ingredients you have, separated by commas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., chicken breast, cherry tomatoes, garlic, olive oil"
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Suggest a Recipe"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && (
          <Card className="w-full mt-8 shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>

          </Alert>
        )}

        {recipe && (
          <Card className="w-full mt-8 shadow-lg overflow-hidden text-left">
            <CardHeader className="p-0">
              <div className="relative w-full h-64 md:h-80">
                <Image
                  src={recipe.imageUrl || "https://placehold.co/600x400.png"}
                  alt={recipe.recipeName}
                  fill
                  style={{objectFit: 'cover'}}
                  className="bg-muted"
                  data-ai-hint="recipe food"
                />
              </div>
              <div className="p-6">
                <CardTitle className="text-3xl font-headline">
                  {recipe.recipeName}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="text-xl font-headline flex items-center gap-2 mb-4">
                  <ShoppingBasket className="h-5 w-5 text-accent" />
                  Ingredients
                </h3>
                <ul className="list-disc list-inside space-y-1 text-card-foreground/80">
                  {recipe.ingredients.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-headline flex items-center gap-2 mb-4">
                  <Utensils className="h-5 w-5 text-accent" />
                  Steps
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-card-foreground/80">
                  {recipe.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
