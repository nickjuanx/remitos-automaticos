
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

const SignaturePad = ({ onSave }: SignaturePadProps) => {
  const padRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (padRef.current && !isEmpty) {
      const signature = padRef.current.toDataURL();
      onSave(signature);
      toast.success("Firma guardada", {
        icon: <Check className="h-4 w-4" />,
      });
    }
  };

  return (
    <div className="border rounded-lg p-2">
      <div className="border rounded mb-2" style={{ touchAction: 'none' }}>
        <SignatureCanvas
          ref={padRef}
          canvasProps={{
            className: "signature-canvas w-full h-[200px]",
          }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
        <Button 
          type="button" 
          onClick={handleSave} 
          disabled={isEmpty}
          className="bg-[#5CB874] hover:bg-[#4ca363]"
        >
          Guardar Firma
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
