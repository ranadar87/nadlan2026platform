import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import SourceSelector from "../components/scrape/SourceSelector";
import ScrapeForm from "../components/scrape/ScrapeForm";

export default function Scrape() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [source, setSource] = useState("yad2");
  const [params, setParams] = useState({ max_items: "150", deal_type: "buy" });
  const [scraping, setScraping] = useState(false);

  const estimatedCredits = Number(params.max_items) || 150;

  const handleScrape = async () => {
    if (!params.city) {
      toast({ title: "שגיאה", description: "יש להזין עיר לחיפוש", variant: "destructive" });
      return;
    }
    setScraping(true);
    const sources = source === "both" ? ["yad2", "madlan"] : [source];

    for (const src of sources) {
      const batch = await base44.entities.ScrapeBatch.create({
        source: src,
        status: "running",
        search_params: params,
      });

      const response = await base44.functions.invoke("scrapeLeads", {
        source: src,
        batch_id: batch.id,
        city: params.city,
        deal_type: params.deal_type || "buy",
        max_items: Number(params.max_items) || 150,
        min_price: params.min_price ? Number(params.min_price) : undefined,
        max_price: params.max_price ? Number(params.max_price) : undefined,
        min_rooms: params.min_rooms ? Number(params.min_rooms) : undefined,
        max_rooms: params.max_rooms ? Number(params.max_rooms) : undefined,
        neighbourhood: params.neighbourhood || undefined,
        require_parking: params.require_parking || false,
        require_elevator: params.require_elevator || false,
        require_balcony: params.require_balcony || false,
        require_secure_room: params.require_secure_room || false,
        exclude_agents: params.exclude_agents || false,
      });

      const result = response.data;
      toast({
        title: `שאיבה מ${src === "yad2" ? "יד2" : "מדלן"} הושלמה`,
        description: `${result.new_leads || 0} לידים חדשים, ${result.duplicates || 0} כפולים`,
      });
    }

    setScraping(false);
    navigate("/leads");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">מקור הנתונים</h3>
          <p className="text-xs text-muted-foreground mb-4">בחר מאיזה אתר לשאוב לידים</p>
          <SourceSelector value={source} onChange={setSource} />
        </div>
        <div className="border-t border-border" />
        <ScrapeForm params={params} onChange={setParams} />
        <div className="border-t border-border" />
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">עלות שאיבה מוערכת: ~{estimatedCredits} קרדיטים</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              בהתבסס על פרמטרי החיפוש
              {source === "both" && " • שאיבה כפולה = עלות כפולה"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={handleScrape} disabled={scraping}>
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scraping ? "שואב לידים..." : "התחל שאיבה"}
          </Button>
          <Button variant="outline" className="border-border">שמור כתבנית</Button>
        </div>
      </div>
    </div>
  );
}