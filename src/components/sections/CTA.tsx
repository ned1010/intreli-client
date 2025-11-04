import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
const CTA = () => {
    return (
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                    Ready to Transform Your Knowledge?
                </h2>
                <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                    Join organizations already using Intreli to unlock the power of their knowledge base.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Button
                        size="lg"
                        className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => window.location.href = "/organization-signup"}
                    >
                        <Star className="w-5 h-5 mr-2" />
                        Start Your Organization
                    </Button>
                </div>
            </div>
        </section>
    )
}
export default CTA;