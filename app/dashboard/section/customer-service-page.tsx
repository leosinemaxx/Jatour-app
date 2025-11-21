"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Send,
  FileText,
  HelpCircle,
  Star,
  MapPin,
  Calendar,
  Headphones,
  Shield,
  Zap,
  Clock3,
  ArrowRight,
  ExternalLink,
  Globe,
  Camera,
  MessageSquare
} from "lucide-react";
import Image from "next/image";

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  responseTime: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ContactMethod {
  id: string;
  name: string;
  description: string;
  icon: any;
  action: string;
  available: boolean;
  responseTime: string;
}

const supportCategories: SupportCategory[] = [
  {
    id: "booking",
    name: "Booking & Reservasi",
    description: "Masalah terkait pemesanan, pembayaran, dan konfirmasi",
    icon: Calendar,
    color: "from-blue-500 to-cyan-500",
    responseTime: "< 2 jam"
  },
  {
    id: "itinerary",
    name: "Smart Itinerary",
    description: "Bantuan untuk membuat dan mengelola rencana perjalanan",
    icon: FileText,
    color: "from-green-500 to-emerald-500",
    responseTime: "< 1 jam"
  },
  {
    id: "technical",
    name: "Masalah Teknis",
    description: "Error aplikasi, login, dan masalah teknis lainnya",
    icon: AlertTriangle,
    color: "from-orange-500 to-red-500",
    responseTime: "< 30 menit"
  },
  {
    id: "general",
    name: "Pertanyaan Umum",
    description: "Informasi umum tentang JaTour dan layanan kami",
    icon: HelpCircle,
    color: "from-purple-500 to-pink-500",
    responseTime: "< 4 jam"
  }
];

const contactMethods: ContactMethod[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Chat langsung dengan customer service",
    icon: MessageCircle,
    action: "Chat Sekarang",
    available: true,
    responseTime: "< 5 menit"
  },
  {
    id: "email",
    name: "Email Support",
    description: "Kirim laporan detail via email",
    icon: Mail,
    action: "Kirim Email",
    available: true,
    responseTime: "< 2 jam"
  },
  {
    id: "phone",
    name: "Telepon Langsung",
    description: "Hubungi hotline JaTour 24/7",
    icon: Phone,
    action: "Telepon Sekarang",
    available: true,
    responseTime: "Segera"
  },
  {
    id: "livechat",
    name: "Live Chat",
    description: "Chat real-time dengan tim support",
    icon: MessageSquare,
    action: "Mulai Chat",
    available: false,
    responseTime: "< 10 menit"
  }
];

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "Bagaimana cara menggunakan Smart Planner?",
    answer: "Mulai dari menu Smart Planner, isi preferensi Anda (tema wisata, kota tujuan, tanggal perjalanan), kemudian generate itinerary secara otomatis dengan fitur AI JaTour.",
    category: "itinerary"
  },
  {
    id: "2", 
    question: "Apakah JaTour gratis digunakan?",
    answer: "Ya, JaTour gratis untuk semua pengguna. Beberapa fitur premium seperti detailed itinerary report dan consultation tersedia dengan biaya terpisah.",
    category: "general"
  },
  {
    id: "3",
    question: "Bagaimana cara membatalkan atau mengubah booking?",
    answer: "Masuk ke menu 'My Itinerary', pilih itinerary yang ingin diubah, lalu klik 'Edit' atau 'Cancel'. Perubahan dapat dilakukan hingga 24 jam sebelum jadwal perjalanan.",
    category: "booking"
  },
  {
    id: "4",
    question: "Kenapa aplikasi sering error saat generate itinerary?",
    answer: "Pastikan koneksi internet stabil dan data preferensi sudah lengkap diisi. Jika masalah berlanjut, restart aplikasi atau hubungi tim technical support.",
    category: "technical"
  },
  {
    id: "5",
    question: "Apakah data itinerario saya aman?",
    answer: "Semua data traveler dienkripsi dan disimpan dengan aman. JaTour mengikuti standar keamanan internasional untuk perlindungan data pribadi.",
    category: "general"
  }
];

export default function CustomerServicePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
    attachments: []
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Report submitted:", formData);
  };

  const filteredFAQs = selectedCategory 
    ? faqItems.filter(faq => faq.category === selectedCategory)
    : faqItems;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Pusat Pelayanan JaTour
              </h1>
              <p className="text-purple-100 text-sm sm:text-base">
                Tim support siap membantu Anda 24/7 dengan response time tercepat
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Contact Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {contactMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group ${
              !method.available ? 'opacity-60' : ''
            }`}>
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${
                  !method.available ? 'bg-gray-400' : ''
                }`}>
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{method.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{method.description}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 mb-3">
                  <Clock3 className="h-3 w-3" />
                  <span>{method.responseTime}</span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full rounded-xl text-xs"
                  disabled={!method.available}
                >
                  {method.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Support Categories & Report Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Categories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-purple-600" />
                Kategori Bantuan
              </h2>
              <div className="space-y-3">
                {supportCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedCategory === category.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <category.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Zap className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">{category.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Report Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Laporkan Masalah / Feedback
              </h2>
              
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nama Lengkap *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="mt-1 rounded-xl"
                      placeholder="Masukkan nama Anda"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="mt-1 rounded-xl"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Kategori Masalah *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="mt-1 w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {supportCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                    Subjek *
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    className="mt-1 rounded-xl"
                    placeholder="Ringkasan singkat masalah Anda"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Detail Masalah *
                  </Label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className="mt-1 w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Jelaskan masalah atau feedback Anda secara detail..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="attachments" className="text-sm font-medium text-gray-700">
                    Lampiran (opsional)
                  </Label>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Klik untuk upload screenshot atau dokumen pendukung
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Format: JPG, PNG, PDF (Max 10MB)
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Laporan
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setSelectedFAQ(selectedFAQ === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <ArrowRight className={`h-4 w-4 text-gray-400 transition-transform ${
                      selectedFAQ === faq.id ? 'rotate-90' : ''
                    }`} />
                  </button>
                  {selectedFAQ === faq.id && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500 rounded-2xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-2">Darurat?</h3>
                <p className="text-red-700 text-sm mb-4">
                  Jika Anda sedang dalam perjalanan dan membutuhkan bantuan darurat, hubungi hotline 24/7 JaTour
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <Phone className="h-4 w-4 mr-2" />
                    Hotline Darurat: 0804-177-8899
                  </Button>
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp Emergency
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Hours & Office Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Jam Operasional
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer Service</span>
                <Badge className="bg-green-100 text-green-800">24/7 Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">WhatsApp Support</span>
                <span className="text-gray-900 font-medium">06:00 - 24:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phone Support</span>
                <span className="text-gray-900 font-medium">08:00 - 22:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Emergency Line</span>
                <Badge className="bg-red-100 text-red-800">24/7</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Kantor JaTour
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">JaTour Headquarters</p>
                <p className="text-sm text-gray-600">
                  Jl. Tunjungan No. 123, Genteng<br />
                  Surabaya, Jawa Timur 60275
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">+62 31 501 2345</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">support@jatour.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">www.jatour.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
