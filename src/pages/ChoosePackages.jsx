import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createWorker } from "tesseract.js";
import DateSelector from "./Date";

/*
   BACKDROPS
*/

const freeBackdrops = [
  "Purple",
  "Blue",
  "White",
  "Silver",
  "Brown",
];

const extraBackdrops = [
  "Cream",
  "Black",
  "Light Pink",
  "Maroon",
  "Gold",
];

export default function ChoosePackages({
  selectedPackage,
  onConfirm,
  setCurrentView,
  appointments = [],
}) {
  /* 
     APPOINTMENT
 */

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const isSlotBooked = (selectedDate, selectedTime) => {
  return appointments.some(
    (appointment) =>
      appointment.date === selectedDate &&
      appointment.time === selectedTime &&
      appointment.status !== "Cancelled"
  );
};

  /*
     CUSTOMER INFORMATION
  */

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [smsConsent, setSmsConsent] =
    useState(false);

  /*
     PAYMENT
   */

  const [paymentMethod, setPaymentMethod] =
    useState("");

  /* 
     GCASH
*/

  const [gcashReceipt, setGcashReceipt] =
    useState(null);

  const [gcashReference, setGcashReference] =
    useState("");

  const [receiptStatus, setReceiptStatus] =
    useState("");

  const [receiptMessage, setReceiptMessage] =
    useState("");

  const [isCheckingReceipt, setIsCheckingReceipt] =
    useState(false);

  const [ocrReady, setOcrReady] =
    useState(false);

  const [ocrText, setOcrText] =
    useState("");

  /* 
     RECEIPT PREVIEW
 */

  const [receiptPreview, setReceiptPreview] =
    useState("");

  /* 
     OCR REFS
   */

  const ocrWorkerRef =
    useRef(null);

  const ocrLoadingRef =
    useRef(false);

  const uploadIdRef =
    useRef(0);

  /* 
     BACKDROPS
   */

  const [
    freeBackdropsSelected,
    setFreeBackdropsSelected,
  ] = useState([]);

  const [
    extraBackdropsSelected,
    setExtraBackdropsSelected,
  ] = useState([]);

  /* WEBSITE NOTIFICATION */
  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
  });

  const showNotification = (title, message) => {
    setNotification({ open: true, title, message });
  };

  const closeNotification = () => {
    setNotification({ open: false, title: "", message: "" });
  };

  /* 
     TOTAL
  */

  const total = useMemo(() => {
    const packagePrice =
      selectedPackage?.price || 0;

    const extraPrice =
      extraBackdropsSelected.length > 0
        ? 100
        : 0;

    return packagePrice + extraPrice;
  }, [
    selectedPackage,
    extraBackdropsSelected,
  ]);



  const getOcrWorker = async () => {
    /*
      Worker already exists.
    */
    if (ocrWorkerRef.current) {
      return ocrWorkerRef.current;
    }

    /*
      If another initialization is already happening,
      wait for it instead of creating another worker.
    */
    if (ocrLoadingRef.current) {
      while (
        ocrLoadingRef.current &&
        !ocrWorkerRef.current
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 50)
        );
      }

      return ocrWorkerRef.current;
    }

    ocrLoadingRef.current = true;

    try {
    
      const worker =
        await createWorker("eng");

      
      try {
        await worker.setParameters({
          tessedit_pageseg_mode: "6",
        });
      } catch (error) {
   

        console.warn(
          "Could not set OCR page mode:",
          error
        );
      }

      ocrWorkerRef.current =
        worker;

      setOcrReady(true);

      return worker;
    } catch (error) {
      console.error(
        "Failed to initialize OCR:",
        error
      );

      setOcrReady(false);

      throw error;
    } finally {
      ocrLoadingRef.current = false;
    }
  };



  useEffect(() => {
    getOcrWorker().catch((error) => {
      console.error(
        "OCR initialization error:",
        error
      );
    });

 
  }, []);

  /* 
     CLEANUP RECEIPT PREVIEW
  */

  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(
          receiptPreview
        );
      }
    };
  }, [receiptPreview]);

  /* 
     FREE BACKDROP
  */

  const handleFreeBackdropChange = (
    backdrop
  ) => {
    setFreeBackdropsSelected(
      (current) => {
        /*
          Remove if already selected.
        */
        if (
          current.includes(backdrop)
        ) {
          return current.filter(
            (item) =>
              item !== backdrop
          );
        }

        /*
          Maximum 2.
        */
        if (current.length >= 2) {
          showNotification(
            "Free Backdrop Limit",
            "You can select up to 2 free backdrops only."
          );

          return current;
        }

        return [
          ...current,
          backdrop,
        ];
      }
    );
  };

  /* 
     EXTRA BACKDROP
  */

  const handleExtraBackdropChange = (
    backdrop
  ) => {
    setExtraBackdropsSelected(
      (current) => {
        /*
          Remove if already selected.
        */
        if (
          current.includes(backdrop)
        ) {
          return current.filter(
            (item) =>
              item !== backdrop
          );
        }

        /*
          Maximum 2.
        */
        if (current.length >= 2) {
          showNotification(
            "Extra Backdrop Limit",
            "You can select up to 2 extra backdrops only."
          );

          return current;
        }

        return [
          ...current,
          backdrop,
        ];
      }
    );
  };

  /* 
     NORMALIZE OCR TEXT
  */

  const normalizeOcrText = (
    text
  ) => {
    return text
      .toLowerCase()
      .replace(/[|]/g, "i")
      .replace(/\s+/g, " ")
      .trim();
  };

  const findReferenceNumbers = (
    text
  ) => {
    const compactText =
      text.replace(
        /[\s-]/g,
        ""
      );

    return (
      compactText.match(
        /\d{13}/g
      ) || []
    );
  };



  const prepareImageForOCR = (
    file
  ) => {
    return new Promise(
      (resolve, reject) => {
        const image =
          new Image();

        const objectUrl =
          URL.createObjectURL(
            file
          );

        image.onload = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          const maxSize = 1000;

          let width =
            image.width;

          let height =
            image.height;

          /*
            Resize only if necessary.
          */
          if (
            width > maxSize ||
            height > maxSize
          ) {
            const scale =
              Math.min(
                maxSize / width,
                maxSize / height
              );

            width =
              Math.round(
                width * scale
              );

            height =
              Math.round(
                height * scale
              );
          }

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          /*
            White background.
          */
          ctx.fillStyle =
            "#ffffff";

          ctx.fillRect(
            0,
            0,
            width,
            height
          );

          /*
            Draw receipt.
          */
          ctx.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Could not process receipt image."
                  )
                );

                return;
              }

              resolve(blob);
            },
            "image/jpeg",
            0.85
          );
        };

        image.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "Could not load receipt image."
            )
          );
        };

        image.src =
          objectUrl;
      }
    );
  };

  /* 
     VERIFY GCASH RECEIPT
  */

  const verifyGcashReceipt = async (
    file
  ) => {
 
    const currentUploadId =
      ++uploadIdRef.current;

    setIsCheckingReceipt(
      true
    );

    setReceiptStatus(
      "checking"
    );

    setReceiptMessage(
      "Checking receipt..."
    );

    setOcrText("");

    try {
    
      const worker =
        await getOcrWorker();

    
      const processedImage =
        await prepareImageForOCR(
          file
        );

      /*
        Perform OCR.
      */
      const result =
        await worker.recognize(
          processedImage
        );

      /*
        Ignore result if a newer image was uploaded.
      */
      if (
        currentUploadId !==
        uploadIdRef.current
      ) {
        return;
      }

      const text =
        result?.data?.text ||
        "";

      setOcrText(text);

      const normalized =
        normalizeOcrText(
          text
        );

      /* 
         GCASH RECEIPT INDICATORS

      */

      const hasGcash =
        normalized.includes(
          "gcash"
        );

      const hasSentViaGcash =
        normalized.includes(
          "sent via gcash"
        );

      const hasTotalAmountSent =
        normalized.includes(
          "total amount sent"
        );

      const hasRefNo =
        normalized.includes(
          "ref no"
        ) ||
        normalized.includes(
          "ref. no"
        ) ||
        normalized.includes(
          "refno"
        ) ||
        normalized.includes(
          "reference no"
        ) ||
        normalized.includes(
          "reference number"
        );

      const hasAmount =
        normalized.includes(
          "amount"
        );

      /*
        Count receipt-specific indicators.
      */
      const indicators = [
        hasSentViaGcash,
        hasTotalAmountSent,
        hasRefNo,
        hasAmount,
      ].filter(Boolean)
        .length;

     
      const isGcashReceipt =
        hasGcash &&
        indicators >= 1;

      if (
        !isGcashReceipt
      ) {
        setReceiptStatus(
          "warning"
        );

        setReceiptMessage(
          "Please upload a clear image of your GCash payment receipt."
        );

        return;
      }

      const detectedReferences =
        findReferenceNumbers(
          text
        );

      console.log(
        "Detected GCash reference numbers:",
        detectedReferences
      );

      /*
        Receipt passed.
      */
      setReceiptStatus(
        "valid"
      );

      setReceiptMessage(
        "This looks like a valid GCash receipt."
      );
    } catch (error) {
      console.error(
        "GCash OCR error:",
        error
      );

      if (
        currentUploadId !==
        uploadIdRef.current
      ) {
        return;
      }

      setReceiptStatus(
        "warning"
      );

      setReceiptMessage(
        "We could not read the receipt. Please upload a clear GCash payment receipt."
      );
    } finally {
      if (
        currentUploadId ===
        uploadIdRef.current
      ) {
        setIsCheckingReceipt(
          false
        );
      }
    }
  };

  /* 
     RECEIPT UPLOAD
  */

  const handleReceiptUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
      Only allow images.
    */
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setGcashReceipt(
        null
      );

      setReceiptStatus(
        "warning"
      );

      setReceiptMessage(
        "Please upload a JPG, JPEG, or PNG image."
      );

      return;
    }


    
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setGcashReceipt(
        null
      );

      setReceiptStatus(
        "warning"
      );

      setReceiptMessage(
        "The image is too large. Please upload an image smaller than 10 MB."
      );

      return;
    }

    /*
      Store actual File.
    */
    setGcashReceipt(
      file
    );

    /*
      Create preview.
    */
    const newPreview =
      URL.createObjectURL(
        file
      );

    setReceiptPreview(
      (oldPreview) => {
        if (oldPreview) {
          URL.revokeObjectURL(
            oldPreview
          );
        }

        return newPreview;
      }
    );

    /*
      Reset status while checking.
    */
    setReceiptStatus(
      "checking"
    );

    setReceiptMessage(
      "Checking receipt..."
    );

    setOcrText("");

    /*
      Begin OCR.
    */
    verifyGcashReceipt(
      file
    );
  };

  /* 
     REFERENCE NUMBER
     Always exactly 13 digits.
  */

  const handleReferenceChange = (
    event
  ) => {
    /*
      Remove anything that isn't a digit.
    */
    const digits =
      event.target.value.replace(
        /\D/g,
        ""
      );

    /*
      Maximum 13 digits.
    */
    setGcashReference(
      digits.slice(0, 13)
    );

  };

  /* 
     CHANGE PAYMENT METHOD
  */

  const handlePaymentChange = (
    value
  ) => {
    setPaymentMethod(
      value
    );

    if (
      value !== "GCash"
    ) {
      setGcashReceipt(
        null
      );

      setGcashReference(
        ""
      );

      setReceiptStatus(
        ""
      );

      setReceiptMessage(
        ""
      );

      setReceiptPreview(
        (oldPreview) => {
          if (oldPreview) {
            URL.revokeObjectURL(
              oldPreview
            );
          }

          return "";
        }
      );

      setOcrText("");
    }
  };

  /* 
     SUBMIT BOOKING
  */

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    /* 
       DATE / TIME
    */

    if (
      !date ||
      !time
    ) {
      showNotification(
        "Appointment Details Required",
        "Please select your appointment date and time."
      );

      return;
    }

   
if (isSlotBooked(date, time)) {
  showNotification(
    "Time Slot Unavailable",
    `Sorry, ${date} at ${time} is already booked. Please choose another available time slot.`
  );

  setTime("");
  return;
}

    /* 
       CUSTOMER INFORMATION
    */

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone
    ) {
      showNotification(
        "Customer Information Required",
        "Please complete all required customer information."
      );

      return;
    }

    /* 
       PAYMENT METHOD
    */

    if (!paymentMethod) {
      showNotification(
        "Payment Required",
        "Please select a payment method"
      );

      return;
    }

    /* 
       GCASH VALIDATION
    */

    if (
      paymentMethod ===
      "GCash"
    ) {
      /*
        Receipt must exist.
      */
      if (!gcashReceipt) {
        showNotification(
          "GCash Receipt Required",
          "Please upload your GCash receipt."
        );

        return;
      }

      /*
        Receipt must have passed OCR.
      */
      if (
        receiptStatus !==
        "valid"
      ) {
        showNotification(
          "Invalid GCash Receipt",
          "Please upload a valid GCash receipt."
        );

        return;
      }

      /*
        Reference is required.
      */
      if (
        !gcashReference
      ) {
        showNotification(
          "GCash Reference Required",
          "Please enter your GCash reference number."
        );

        return;
      }

      /*
        Reference must ALWAYS be exactly 13 digits.
      */
      if (
        !/^\d{13}$/.test(
          gcashReference
        )
      ) {
        showNotification(
          "Invalid GCash Reference",
          "Your GCash reference number must be exactly 13 digits."
        );

        return;
      }

      /*
        Don't allow submission while OCR is still running.
      */
      if (
        isCheckingReceipt
      ) {
        showNotification(
          "Please Wait",
          "Please wait while your GCash receipt is being verified."
        );

        return;
      }
    }

    /* 
       FREE BACKDROP
    */

    if (
      freeBackdropsSelected.length ===
      0
    ) {
      showNotification(
        "Free Backdrop Required",
        "Please select atleast one free backdrop"
      );

      return;
    }

    /* 
       SEND BOOKING DATA TO APP
    */

    onConfirm({
      date,
      time,

      firstName,
      lastName,
      email,
      phone,

      smsConsent,

      paymentMethod,

      /*
        GCash
      */
      gcashReceipt,
      gcashReference,

      /*
        Backdrops
      */
      freeBackdrops:
        freeBackdropsSelected,

      extraBackdrops:
        extraBackdropsSelected,

      /*
        Compatibility
      */
      freeBackdrop:
        freeBackdropsSelected.join(
          ", "
        ),

      extraBackdrop:
        extraBackdropsSelected.join(
          ", "
        ),

      total,
    });
  };

  /* 
     RENDER
*/

  return (
    <div className="min-h-screen w-full bg-slate-50">

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* 
            HEADER
        */}

        <div className="mb-10">

          <p className="text-sm font-bold tracking-[0.2em] uppercase text-sky-600">
            Step 2 of 2
          </p>

          <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-slate-950">
            Complete Your Booking
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Provide your details and customize your
            self-photography experience.
          </p>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* 
              LEFT
          */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* 
                APPOINTMENT DETAILS
            */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">

              <div className="flex items-start gap-4 mb-7">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">
                  01
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-950">
                    Appointment Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select your preferred date and available time.
                  </p>

                </div>

              </div>

              <div className="rounded-xl bg-slate-50 p-5">

               <DateSelector
                  date={date}
                  setDate={setDate}
                  time={time}
                  setTime={setTime}
                  appointments={appointments}

                />

              </div>

            </div>

            {/* 
                CUSTOMER INFORMATION
            */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">

              <div className="flex items-start gap-4 mb-7">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">
                  02
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-950">
                    Customer Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    All fields marked with * are required.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* FIRST NAME */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    First Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />

                </div>

                {/* LAST NAME */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Last Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />

                </div>

                {/* PHONE */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Phone Number *
                  </label>

                  <input
                    type="tel"
                    placeholder="09XXXXXXXXX"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />

                </div>

              </div>

              {/* SMS */}

              <label className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">

                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) =>
                    setSmsConsent(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 accent-sky-600"
                />

                <span className="text-xs leading-5 text-slate-500">
                  By checking this box, you agree to receive
                  transactional SMS messages. Message frequency
                  varies. Message rates may apply. Text HELP
                  for help. Text STOP to stop.
                </span>

              </label>

            </div>

            {/* 
                PAYMENT
            */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">

              <div className="flex items-start gap-4 mb-7">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">
                  03
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-950">
                    Mode of Payment
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select your preferred payment method.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* CASH */}

                <label
                  className={`cursor-pointer rounded-xl border p-5 transition ${
                    paymentMethod ===
                    "Cash"
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                      : "border-slate-200 bg-white hover:border-sky-300"
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="Cash"
                    checked={
                      paymentMethod ===
                      "Cash"
                    }
                    onChange={(e) =>
                      handlePaymentChange(
                        e.target.value
                      )
                    }
                    className="sr-only"
                  />

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                      💵
                    </div>

                    <div>

                      <p className="font-bold text-slate-950">
                        Cash
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Pay at the studio
                      </p>

                    </div>

                  </div>

                </label>

                {/* GCASH */}

                <label
                  className={`cursor-pointer rounded-xl border p-5 transition ${
                    paymentMethod ===
                    "GCash"
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                      : "border-slate-200 bg-white hover:border-sky-300"
                  }`}
                >

                  <input
                    type="radio"
                    name="payment"
                    value="GCash"
                    checked={
                      paymentMethod ===
                      "GCash"
                    }
                    onChange={(e) =>
                      handlePaymentChange(
                        e.target.value
                      )
                    }
                    className="sr-only"
                  />

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-2xl">
                      📱
                    </div>

                    <div>

                      <p className="font-bold text-slate-950">
                        GCash
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Digital payment
                      </p>

                    </div>

                  </div>

                </label>

              </div>

              {/* 
                  GCASH RECEIPT
              */}

              {paymentMethod ===
                "GCash" && (
                <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">

                  <div className="mb-5">

                    <h3 className="text-lg font-bold text-slate-950">
                      GCash Payment Verification
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Upload your GCash payment receipt and enter
                      the 13-digit reference number shown on the receipt.
                    </p>

                    {/* OCR STATUS */}

                    <div className="mt-3">

                      {ocrReady ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                          <span>
                            ✓
                          </span>

                          <span>
                            Receipt verification ready
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700">
                          <span className="animate-pulse">
                            ●
                          </span>

                          <span>
                            Preparing receipt verification...
                          </span>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* 
                      RECEIPT
                  */}

                  <div>

                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      GCash Receipt *
                    </label>

                    <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-white p-6 text-center transition hover:border-sky-500 hover:bg-sky-50">

                      {gcashReceipt ? (
                        <div className="w-full">

                          {receiptPreview && (
                            <img
                              src={
                                receiptPreview
                              }
                              alt="GCash receipt preview"
                              className="mx-auto max-h-64 rounded-lg object-contain shadow-sm"
                            />
                          )}

                          <p className="mt-3 text-sm font-bold text-sky-700">
                            Receipt uploaded
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Click here to replace the receipt
                          </p>

                        </div>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-2xl">
                            📷
                          </div>

                          <p className="mt-3 text-sm font-bold text-slate-700">
                            Put your GCash receipt here
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Click to upload an image
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            JPG, JPEG, or PNG
                          </p>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={
                          handleReceiptUpload
                        }
                      />

                    </label>

                    {/* 
                        CHECKING
                    */}

                    {receiptStatus ===
                      "checking" && (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">

                        <div className="flex items-center gap-2">

                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                          <p className="text-sm font-bold text-blue-700">
                            Checking receipt...
                          </p>

                        </div>

                        <p className="mt-1 text-xs text-blue-600">
                          Verifying that this image is a GCash payment receipt.
                        </p>

                      </div>
                    )}

                    {/* 
                        VALID
                    */}

                    {receiptStatus ===
                      "valid" && (
                      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">

                        <p className="text-sm font-bold text-green-700">
                          ✓ GCash receipt verified
                        </p>

                        <p className="mt-1 text-xs text-green-600">
                          This image looks like a valid GCash payment receipt.
                        </p>

                      </div>
                    )}

                    {/* 
                        WARNING
                    */}

                    {receiptStatus ===
                      "warning" && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">

                        <p className="text-sm font-bold text-red-700">
                          ⚠ Error: Not a GCash receipt.
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          {receiptMessage ||
                            "Please upload a clear image of your GCash payment receipt."}
                        </p>

                      </div>
                    )}

                  </div>

                  {/* 
                      REFERENCE NUMBER
                  */}

                  <div className="mt-5">

                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      GCash Reference Number *
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Enter 13-digit reference number"
                      value={
                        gcashReference
                      }
                      onChange={
                        handleReferenceChange
                      }
                      maxLength={13}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition ${
                        gcashReference.length ===
                        13
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                          : "border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      }`}
                    />

                    <div className="mt-2 flex items-center justify-between">

                      <p className="text-xs text-slate-500">
                        You can find the reference number on your GCash payment receipt.
                      </p>

                      <span
                        className={`shrink-0 text-xs font-bold ${
                          gcashReference.length ===
                          13
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                      >
                        {
                          gcashReference.length
                        }
                        /13
                      </span>

                    </div>

                    {/* REFERENCE STATUS */}

                    {gcashReference.length >
                      0 &&
                      gcashReference.length <
                        13 && (
                        <p className="mt-2 text-xs font-medium text-orange-600">
                          Please enter all 13 digits.
                        </p>
                      )}

                    {gcashReference.length ===
                      13 && (
                      <p className="mt-2 text-xs font-medium text-green-600">
                        ✓ 13-digit reference number
                      </p>
                    )}

                  </div>

                  {
                  }

                  {
                  }

                </div>
              )}

            </div>

            {/* 
                BACKDROP
            */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">

              <div className="flex items-start gap-4 mb-7">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">
                  04
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-950">
                    Choose Your Backdrop
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select up to 2 free backdrops and up to 2 extra
                    backdrops.
                  </p>

                </div>

              </div>

              {/* 
                  FREE BACKDROPS
              */}

              <div>

                <div className="flex items-center justify-between mb-4">

                  <div>

                    <h3 className="font-bold text-slate-800">
                      Free Backdrop
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Select up to 2 colors.
                    </p>

                  </div>

                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                    INCLUDED
                  </span>

                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">

                  {freeBackdrops.map(
                    (backdrop) => {
                      const isSelected =
                        freeBackdropsSelected.includes(
                          backdrop
                        );

                      return (
                        <label
                          key={
                            backdrop
                          }
                          className={`relative cursor-pointer rounded-xl border p-3 text-center transition ${
                            isSelected
                              ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                              : "border-slate-200 hover:border-sky-300"
                          }`}
                        >

                          <input
                            type="checkbox"
                            name="freeBackdrop"
                            value={
                              backdrop
                            }
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              handleFreeBackdropChange(
                                backdrop
                              )
                            }
                            className="sr-only"
                          />

                          {isSelected && (
                            <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
                              ✓
                            </div>
                          )}

                          <div
                            className={`mx-auto h-10 w-10 rounded-full border border-slate-300 ${getBackdropColor(
                              backdrop
                            )}`}
                          />

                          <p className="mt-2 text-xs font-bold text-slate-700">
                            {
                              backdrop
                            }
                          </p>

                        </label>
                      );
                    }
                  )}

                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {
                    freeBackdropsSelected.length
                  }
                  /2 free backdrops selected
                </p>

              </div>

              <div className="my-8 border-t border-slate-100" />

              {/* 
                  EXTRA BACKDROPS
              */}

              <div>

                <div className="flex items-center justify-between mb-2">

                  <div>

                    <h3 className="font-bold text-slate-800">
                      Extra Backdrop
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Select up to 2 additional colors.
                    </p>

                  </div>

                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                    +₱100
                  </span>

                </div>

                <p className="mb-4 text-sm text-slate-500">
                  Optional. Select up to 2 additional backdrops
                  for ₱100.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">

                  {/* NONE */}

                  <label
                    className={`cursor-pointer rounded-xl border p-3 text-center transition ${
                      extraBackdropsSelected.length ===
                      0
                        ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                        : "border-slate-200 hover:border-sky-300"
                    }`}
                  >

                    <input
                      type="checkbox"
                      name="noExtraBackdrop"
                      checked={
                        extraBackdropsSelected.length ===
                        0
                      }
                      onChange={() =>
                        setExtraBackdropsSelected(
                          []
                        )
                      }
                      className="sr-only"
                    />

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400">
                      —
                    </div>

                    <p className="mt-2 text-xs font-bold text-slate-700">
                      None
                    </p>

                  </label>

                  {extraBackdrops.map(
                    (backdrop) => {
                      const isSelected =
                        extraBackdropsSelected.includes(
                          backdrop
                        );

                      return (
                        <label
                          key={
                            backdrop
                          }
                          className={`relative cursor-pointer rounded-xl border p-3 text-center transition ${
                            isSelected
                              ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                              : "border-slate-200 hover:border-sky-300"
                          }`}
                        >

                          <input
                            type="checkbox"
                            name="extraBackdrop"
                            value={
                              backdrop
                            }
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              handleExtraBackdropChange(
                                backdrop
                              )
                            }
                            className="sr-only"
                          />

                          {isSelected && (
                            <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
                              ✓
                            </div>
                          )}

                          <div
                            className={`mx-auto h-10 w-10 rounded-full border border-slate-300 ${getBackdropColor(
                              backdrop
                            )}`}
                          />

                          <p className="mt-2 text-xs font-bold text-slate-700">
                            {
                              backdrop
                            }
                          </p>

                        </label>
                      );
                    }
                  )}

                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {
                    extraBackdropsSelected.length
                  }
                  /2 extra backdrops selected
                </p>

              </div>

            </div>

            {/* 
                BUTTONS
            */}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">

              <button
                type="button"
                onClick={() =>
                  setCurrentView(
                    "packages"
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
              >
                ← Back to Packages
              </button>

              <button
                type="submit"
                disabled={
                  paymentMethod ===
                    "GCash" &&
                  isCheckingReceipt
                }
                className={`rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-sm transition ${
                  paymentMethod ===
                    "GCash" &&
                  isCheckingReceipt
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-sky-600 hover:bg-sky-700 hover:shadow-md"
                }`}
              >
                {paymentMethod ===
                  "GCash" &&
                isCheckingReceipt
                  ? "Verifying Receipt..."
                  : "Confirm Booking →"}
              </button>

            </div>

          </form>

          {/* 
              RIGHT SIDE SUMMARY
          */}

          <aside className="lg:sticky lg:top-28">

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="bg-slate-950 p-6 text-white">

                <p className="text-xs font-bold tracking-[0.15em] text-sky-400">
                  BOOKING SUMMARY
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Your Appointment
                </h2>

              </div>

              <div className="p-6">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 text-2xl">
                    {
                      selectedPackage?.icon ||
                      "📷"
                    }
                  </div>

                  <div>

                    <h3 className="font-bold text-slate-950">
                      {
                        selectedPackage?.name
                      }
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedPackage?.people
                      }
                    </p>

                  </div>

                </div>

                <div className="my-6 border-t border-slate-100" />

                <div className="space-y-4">

                  <SummaryRow
                    label="Date"
                    value={
                      date ||
                      "Not selected"
                    }
                  />

                  <SummaryRow
                    label="Time"
                    value={
                      time ||
                      "Not selected"
                    }
                  />

                  <SummaryRow
                    label="Package"
                    value={`₱${(
                      selectedPackage?.price ||
                      0
                    ).toLocaleString()}`}
                  />

                  <SummaryRow
                    label="Payment"
                    value={
                      paymentMethod ||
                      "Not selected"
                    }
                  />

                  {paymentMethod ===
                    "GCash" &&
                    gcashReference && (
                      <SummaryRow
                        label="GCash Ref."
                        value={
                          gcashReference
                        }
                      />
                    )}

                  <SummaryRow
                    label="Free Backdrop"
                    value={
                      freeBackdropsSelected.length >
                      0
                        ? freeBackdropsSelected.join(
                            ", "
                          )
                        : "Not selected"
                    }
                  />

                  {extraBackdropsSelected.length >
                    0 && (
                    <>
                      <SummaryRow
                        label="Extra Backdrop"
                        value={extraBackdropsSelected.join(
                          ", "
                        )}
                      />

                      <SummaryRow
                        label="Extra Fee"
                        value="+₱100"
                      />
                    </>
                  )}

                </div>

                <div className="my-6 border-t border-slate-100" />

                <div className="flex items-center justify-between">

                  <span className="font-bold text-slate-700">
                    Total Expenses
                  </span>

                  <span className="text-2xl font-bold text-sky-600">
                    ₱
                    {total.toLocaleString()}
                  </span>

                </div>

                <div className="mt-6 rounded-xl bg-sky-50 p-4">

                  <p className="text-xs leading-5 text-sky-800">
                    🔒 Your booking information will be kept
                    secure and used for appointment processing.
                  </p>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </div>

      {/* WEBSITE NOTIFICATION MODAL - React UI, not browser alert */}
      {notification.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4"
          onClick={closeNotification}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                  <path d="M12 8V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="white" />
                </svg>
              </div>
            </div>

            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-950">
              {notification.title}
            </h2>

            <p className="mt-4 text-center text-sm leading-7 text-slate-500">
              {notification.message}
            </p>

            <button
              type="button"
              onClick={closeNotification}
              className="mt-7 w-full rounded-xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}


    </div>
  );
}

/* 
   SUMMARY ROW
*/

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <strong className="max-w-[210px] text-right text-sm text-slate-900 break-words">
        {value}
      </strong>

    </div>
  );
}

/* 
   BACKDROP COLORS
*/

function getBackdropColor(
  backdrop
) {
  const colors = {
    Purple:
      "bg-purple-500",

    Blue:
      "bg-blue-500",

    White:
      "bg-white",

    Silver:
      "bg-slate-300",

    Brown:
      "bg-amber-800",

    Cream:
      "bg-amber-100",

    Black:
      "bg-black",

    "Light Pink":
      "bg-pink-300",

    Maroon:
      "bg-red-900",

    Gold:
      "bg-yellow-400",
  };

  return (
    colors[backdrop] ||
    "bg-slate-200"
  );
}