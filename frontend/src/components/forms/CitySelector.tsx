"use client"

import * as React from "react"
import { useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Major cities by state (sample data - in production this would come from an API)
const CITIES_BY_STATE: Record<string, Array<{ value: string; label: string }>> = {
  "maharashtra": [
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
    { value: "nagpur", label: "Nagpur" },
    { value: "nashik", label: "Nashik" },
    { value: "aurangabad", label: "Aurangabad" },
    { value: "solapur", label: "Solapur" },
    { value: "kolhapur", label: "Kolhapur" },
  ],
  "delhi": [
    { value: "new-delhi", label: "New Delhi" },
    { value: "central-delhi", label: "Central Delhi" },
    { value: "north-delhi", label: "North Delhi" },
    { value: "south-delhi", label: "South Delhi" },
    { value: "east-delhi", label: "East Delhi" },
    { value: "west-delhi", label: "West Delhi" },
  ],
  "karnataka": [
    { value: "bangalore", label: "Bangalore" },
    { value: "mysore", label: "Mysore" },
    { value: "hubli", label: "Hubli" },
    { value: "mangalore", label: "Mangalore" },
    { value: "belgaum", label: "Belgaum" },
    { value: "gulbarga", label: "Gulbarga" },
  ],
  "tamil-nadu": [
    { value: "chennai", label: "Chennai" },
    { value: "coimbatore", label: "Coimbatore" },
    { value: "madurai", label: "Madurai" },
    { value: "tiruchirappalli", label: "Tiruchirappalli" },
    { value: "salem", label: "Salem" },
    { value: "tirunelveli", label: "Tirunelveli" },
  ],
  "gujarat": [
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "surat", label: "Surat" },
    { value: "vadodara", label: "Vadodara" },
    { value: "rajkot", label: "Rajkot" },
    { value: "bhavnagar", label: "Bhavnagar" },
    { value: "jamnagar", label: "Jamnagar" },
  ],
  "west-bengal": [
    { value: "kolkata", label: "Kolkata" },
    { value: "howrah", label: "Howrah" },
    { value: "durgapur", label: "Durgapur" },
    { value: "asansol", label: "Asansol" },
    { value: "siliguri", label: "Siliguri" },
  ],
  "rajasthan": [
    { value: "jaipur", label: "Jaipur" },
    { value: "jodhpur", label: "Jodhpur" },
    { value: "udaipur", label: "Udaipur" },
    { value: "kota", label: "Kota" },
    { value: "bikaner", label: "Bikaner" },
    { value: "ajmer", label: "Ajmer" },
  ],
  "uttar-pradesh": [
    { value: "lucknow", label: "Lucknow" },
    { value: "kanpur", label: "Kanpur" },
    { value: "ghaziabad", label: "Ghaziabad" },
    { value: "agra", label: "Agra" },
    { value: "meerut", label: "Meerut" },
    { value: "varanasi", label: "Varanasi" },
    { value: "allahabad", label: "Allahabad" },
  ],
  "punjab": [
    { value: "chandigarh", label: "Chandigarh" },
    { value: "ludhiana", label: "Ludhiana" },
    { value: "amritsar", label: "Amritsar" },
    { value: "jalandhar", label: "Jalandhar" },
    { value: "patiala", label: "Patiala" },
  ],
  "haryana": [
    { value: "gurgaon", label: "Gurgaon" },
    { value: "faridabad", label: "Faridabad" },
    { value: "panipat", label: "Panipat" },
    { value: "ambala", label: "Ambala" },
    { value: "yamunanagar", label: "Yamunanagar" },
  ],
  "kerala": [
    { value: "kochi", label: "Kochi" },
    { value: "thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "kozhikode", label: "Kozhikode" },
    { value: "thrissur", label: "Thrissur" },
    { value: "kollam", label: "Kollam" },
  ],
}

interface CitySelectorProps {
  value?: string
  onChange: (value: string) => void
  selectedState?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CitySelector({
  value,
  onChange,
  selectedState,
  placeholder = "Select city...",
  disabled = false,
  className,
}: CitySelectorProps) {
  const [open, setOpen] = React.useState(false)

  // Get cities for the selected state
  const availableCities = useMemo(() => {
    return selectedState ? CITIES_BY_STATE[selectedState] || [] : []
  }, [selectedState])
  
  const selectedCity = availableCities.find((city) => city.value === value)

  // Reset city selection when state changes
  React.useEffect(() => {
    if (selectedState && value) {
      const cityExists = availableCities.some((city) => city.value === value)
      if (!cityExists) {
        onChange("")
      }
    }
  }, [selectedState, value, availableCities, onChange])

  const handleSelect = (cityValue: string) => {
    onChange(cityValue)
    setOpen(false)
  }

  const isDisabled = disabled || !selectedState || availableCities.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedCity && "text-muted-foreground",
            className
          )}
          disabled={isDisabled}
        >
          {selectedCity ? selectedCity.label : 
           !selectedState ? "Select state first" : 
           availableCities.length === 0 ? "No cities available" : 
           placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search cities..." />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {availableCities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCity?.value === city.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}