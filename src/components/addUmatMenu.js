import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { FiChevronDown } from "react-icons/fi";
import { useRef } from "react";
import { useRouter } from "next/router";
import { useToast } from "@chakra-ui/react";

const AddUmatMenu = ({ onImportSuccess }) => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleImportUmat = () => {
    fileInputRef.current?.click();
  };

  const handleFileUmatChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:2025/import/umat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengimpor");
      }

      toast({
        title: "Berhasil mengimpor data umat",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onImportSuccess?.();
    } catch (err) {
      toast({
        title: "Gagal mengimpor data",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      e.target.value = "";
    }
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          colorScheme="blue"
          borderRadius="full"
          size="sm"
          rightIcon={<FiChevronDown/>}
        >
          Tambah Umat
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => router.push("/umat/addUmat")}>
            Tambah Manual
          </MenuItem>
          <MenuItem onClick={handleImportUmat}>
            Unggah Data Massal
          </MenuItem>
        </MenuList>
      </Menu>

      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUmatChange}
      />
    </>
  );
};

export default AddUmatMenu;

